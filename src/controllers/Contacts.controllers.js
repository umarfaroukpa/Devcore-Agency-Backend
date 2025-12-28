"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.replyToContact = exports.deleteContactMessage = exports.updateContactMessageStatus = exports.getContactMessageById = exports.getContactMessages = exports.submitContactForm = void 0;
const ErrorHandler_1 = require("../middleware/ErrorHandler");
const emailservices_1 = require("../utils/emailservices");
const prisma_1 = __importDefault(require("../config/prisma"));
// POST /api/contact - Handle contact form submissions
exports.submitContactForm = (0, ErrorHandler_1.asyncHandler)(async (req, res) => {
    const { name, email, company, service, message } = req.body;
    // Validate required fields
    if (!name || !email || !message) {
        throw new ErrorHandler_1.AppError('Name, email, and message are required', 400);
    }
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new ErrorHandler_1.AppError('Invalid email address', 400);
    }
    try {
        // Save contact message to database 
        const contactMessage = await prisma_1.default.contactMessage.create({
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
        await (0, emailservices_1.sendEmail)(email, 'message-received-client', {
            user: { firstName: name }
        });
        // Send notification email to admin/sales team
        const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
        if (adminEmail) {
            await (0, emailservices_1.sendEmail)(adminEmail, 'new-contact-inquiry', {
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
    }
    catch (error) {
        console.error('Contact form error:', error);
        // If email fails but we want to still save the message
        if (error.message?.includes('email')) {
            throw new ErrorHandler_1.AppError('Failed to send confirmation email. Please try again or contact us directly.', 500);
        }
        throw new ErrorHandler_1.AppError('Failed to submit contact form. Please try again.', 500);
    }
});
// GET /api/contact - Get all contact messages (Admin only)
exports.getContactMessages = (0, ErrorHandler_1.asyncHandler)(async (req, res) => {
    const { status, limit = 50, page = 1 } = req.query;
    const where = {};
    if (status) {
        where.status = status;
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [messages, total] = await Promise.all([
        prisma_1.default.contactMessage.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: Number(limit),
            skip
        }),
        prisma_1.default.contactMessage.count({ where })
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
exports.getContactMessageById = (0, ErrorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const message = await prisma_1.default.contactMessage.findUnique({
        where: { id }
    });
    if (!message) {
        throw new ErrorHandler_1.AppError('Contact message not found', 404);
    }
    // Mark as read
    if (message.status === 'NEW') {
        await prisma_1.default.contactMessage.update({
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
exports.updateContactMessageStatus = (0, ErrorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { status, notes } = req.body;
    const validStatuses = ['NEW', 'READ', 'REPLIED', 'ARCHIVED'];
    if (status && !validStatuses.includes(status)) {
        throw new ErrorHandler_1.AppError('Invalid status', 400);
    }
    const message = await prisma_1.default.contactMessage.update({
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
exports.deleteContactMessage = (0, ErrorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    await prisma_1.default.contactMessage.delete({
        where: { id }
    });
    res.status(200).json({
        success: true,
        message: 'Contact message deleted'
    });
});
// POST /api/contact/:id/reply - Send email reply to contact
exports.replyToContact = (0, ErrorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { message, subject } = req.body;
    if (!message?.trim()) {
        throw new ErrorHandler_1.AppError('Reply message is required', 400);
    }
    // Get the contact message
    const contact = await prisma_1.default.contactMessage.findUnique({
        where: { id }
    });
    if (!contact) {
        throw new ErrorHandler_1.AppError('Contact message not found', 404);
    }
    try {
        // Send the email reply
        await (0, emailservices_1.sendEmail)(contact.email, 'reply-to-contact', {
            subject: subject || `Re: Your Inquiry`,
            replyMessage: message,
            originalMessage: contact.message.substring(0, 200) + '...', // Preview of original
            replyFrom: `Devcore Support Team`,
            contactName: contact.name,
            dashboardUrl: `${process.env.FRONTEND_URL}/dashboard/admin/contact/${contact.id}`
        });
        // Update the contact status and add notes
        const updatedContact = await prisma_1.default.contactMessage.update({
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
    }
    catch (error) {
        console.error('Error sending reply:', error);
        throw new ErrorHandler_1.AppError('Failed to send reply. Please try again.', 500);
    }
});
