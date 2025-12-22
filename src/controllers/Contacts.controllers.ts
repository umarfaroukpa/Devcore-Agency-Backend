import { Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/ErrorHandler';
import { sendEmail } from '../utils/emailservices';
import prisma from '../config/prisma';

// POST /api/contact - Handle contact form submissions
export const submitContactForm = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, company, service, message } = req.body;

  // Validate required fields
  if (!name || !email || !message) {
    throw new AppError('Name, email, and message are required', 400);
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new AppError('Invalid email address', 400);
  }

  try {
    // Save contact message to database 
    const contactMessage = await prisma.contactMessage.create({
      data: {
        name,
        email,
        company: company || null,
        service: service || null,
        message,
        status: 'NEW', // NEW, READ, REPLIED
      }
    });

    // Send confirmation email to client
    await sendEmail(email, 'message-received-client', {
      user: { firstName: name }
    });

    // Send notification email to admin/sales team
    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
    if (adminEmail) {
      await sendEmail(adminEmail, 'new-contact-inquiry', {
        name,
        email,
        company,
        service,
        message,
        messageId: contactMessage.id, 
        dashboardUrl: `${process.env.FRONTEND_URL}/dashboard/admin/contact/${contactMessage.id}`
      });
    }

    res.status(201).json({
      success: true,
      message: 'Thank you for your inquiry! We\'ll contact you within 24 hours.',
      data: {
        id: contactMessage.id,
        status: 'received'
      }
    });

  } catch (error: any) {
    console.error('Contact form error:', error);
    
    // If email fails but we want to still save the message
    if (error.message?.includes('email')) {
      throw new AppError('Failed to send confirmation email. Please try again or contact us directly.', 500);
    }
    
    throw new AppError('Failed to submit contact form. Please try again.', 500);
  }
});

// GET /api/contact - Get all contact messages (Admin only)
export const getContactMessages = asyncHandler(async (req: Request, res: Response) => {
  const { status, limit = 50, page = 1 } = req.query;

  const where: any = {};
  if (status) {
    where.status = status;
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [messages, total] = await Promise.all([
    prisma.contactMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      skip
    }),
    prisma.contactMessage.count({ where })
  ]);

  res.status(200).json({
    success: true,
    data: messages,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit))
    }
  });
});

// GET /api/contact/:id - Get single contact message
export const getContactMessageById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const message = await prisma.contactMessage.findUnique({
    where: { id }
  });

  if (!message) {
    throw new AppError('Contact message not found', 404);
  }

  // Mark as read
  if (message.status === 'NEW') {
    await prisma.contactMessage.update({
      where: { id },
      data: { status: 'READ' }
    });
  }

  res.status(200).json({
    success: true,
    data: message
  });
});

// PATCH /api/contact/:id - Update contact message status
export const updateContactMessageStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, notes } = req.body;

  const validStatuses = ['NEW', 'READ', 'REPLIED', 'ARCHIVED'];
  if (status && !validStatuses.includes(status)) {
    throw new AppError('Invalid status', 400);
  }

  const message = await prisma.contactMessage.update({
    where: { id },
    data: {
      status: status || undefined,
      notes: notes || undefined
    }
  });

  res.status(200).json({
    success: true,
    message: 'Contact message updated',
    data: message
  });
});

// DELETE /api/contact/:id - Delete contact message
export const deleteContactMessage = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  await prisma.contactMessage.delete({
    where: { id }
  });

  res.status(200).json({
    success: true,
    message: 'Contact message deleted'
  });
});

// POST /api/contact/:id/reply - Send email reply to contact
export const replyToContact = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { message, subject } = req.body;

  if (!message?.trim()) {
    throw new AppError('Reply message is required', 400);
  }

  // Get the contact message
  const contact = await prisma.contactMessage.findUnique({
    where: { id }
  });

  if (!contact) {
    throw new AppError('Contact message not found', 404);
  }

  try {
    // Send the email reply
    await sendEmail(contact.email, 'reply-to-contact', {
      subject: subject || `Re: Your Inquiry`,
      replyMessage: message,
      originalMessage: contact.message.substring(0, 200) + '...', // Preview of original
      replyFrom: `Devcore Support Team`,
      contactName: contact.name,
      dashboardUrl: `${process.env.FRONTEND_URL}/dashboard/admin/contact/${contact.id}`
    });

    // Update the contact status and add notes
    const updatedContact = await prisma.contactMessage.update({
      where: { id },
      data: {
        status: 'REPLIED',
        notes: contact.notes 
          ? `${contact.notes}\n\nReplied on ${new Date().toLocaleString()}:\n${message}`
          : `Replied on ${new Date().toLocaleString()}:\n${message}`
      }
    });

    res.status(200).json({
      success: true,
      message: 'Reply sent successfully',
      data: {
        id: updatedContact.id,
        status: updatedContact.status,
        repliedAt: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Error sending reply:', error);
    throw new AppError('Failed to send reply. Please try again.', 500);
  }
});