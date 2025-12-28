"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
// === 1. Transporter (SMTP Setup) ===
const transporter = nodemailer_1.default.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false, // true for 465, false for 587
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
    },
    tls: { rejectUnauthorized: false },
});
// Test connection on startup
transporter.verify((err, success) => {
    if (err)
        console.error('SMTP Error:', err);
    else
        console.log('SMTP Connected →', process.env.SMTP_USER);
});
const sendEmail = async (to, type, data = {}) => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const templates = {
        // 1. Account Approved (Developer/Admin)
        approval: {
            subject: 'Your Devcore Account Has Been Approved!',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 30px; background: #f9fafb; border-radius: 12px;">
          <div style="background: white; padding: 30px; border-radius: 12px; text-align: center;">
            <h1 style="color: #1e40af;">Welcome to Devcore!</h1>
            <p style="font-size: 18px;">Hi <strong>${data.user?.firstName || 'there'}</strong>,</p>
            <p style="font-size: 16px; color: #374151;">
              Your application as a <strong style="color: #1d4ed8;">${data.user?.role}</strong> has been <span style="color: #16a34a; font-weight: bold;">APPROVED</span>!
            </p>
            <a href="${frontendUrl}/login" style="background: #1d4ed8; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; margin: 20px 0;">
              Login to Dashboard
            </a>
          </div>
          <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 20px;">© 2025 Devcore</p>
        </div>
      `,
        },
        // 2. Welcome Client
        'welcome-client': {
            subject: 'Welcome to Devcore  Lets Build Something Amazing',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 30px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border-radius: 12px;">
          <div style="background: white; color: #1f2937; padding: 40px; border-radius: 12px; margin-top: 20px; text-align: center;">
            <h1 style="color: #1e40af;">Welcome to Devcore!</h1>
            <p style="font-size: 17px;">Hi <strong>${data.user?.firstName || data.user?.companyName}</strong>,</p>
            <p>Thank you for joining. You can now create projects and hire top developers.</p>
            <a href="${frontendUrl}/dashboard/clients" style="background: #764ba2; color: white; padding: 16px 36px; text-decoration: none; border-radius: 50px; font-weight: bold; margin: 20px 0; display: inline-block;">
              Go to Dashboard
            </a>
          </div>
        </div>
      `,
        },
        // 3. Password Reset
        'password-reset': {
            subject: 'Reset Your Devcore Password',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 30px; background: #f3f4f6; text-align: center;">
          <div style="background: white; padding: 30px; border-radius: 12px;">
            <h2 style="color: #dc2626;">Password Reset</h2>
            <p>Click below to reset your password (expires in 15 minutes):</p>
            <a href="${data.resetUrl}" style="background: #dc2626; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Reset Password
            </a>
          </div>
        </div>
      `,
        },
        // 4. Project Invitation
        'project-invite': {
            subject: `You've Been Invited to "${data.project?.name}"`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 30px; background: #f0fdf4;">
          <div style="background: white; padding: 30px; border-radius: 12px; border: 2px solid #bbf7d0; text-align: center;">
            <h2 style="color: #16a34a;">New Project Invitation!</h2>
            <p>You've been invited to join:</p>
            <h3 style="color: #166534;">${data.project?.name}</h3>
            <a href="${frontendUrl}/projects/${data.project?.id}" style="background: #16a34a; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              View Project
            </a>
          </div>
        </div>
      `,
        },
        // 5. Application Received (Pending)
        'application-received': {
            subject: 'We Received Your Devcore Application',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 30px; background: #fffbeb;">
          <div style="background: white; padding: 30px; border-radius: 12px; text-align: center;">
            <h2 style="color: #92400e;">Application Received!</h2>
            <p>Thank you for applying as a <strong>${data.user?.role}</strong>.</p>
            <p>We’ll review it within 24–48 hours.</p>
            <a href="${frontendUrl}/pending-approval" style="background: #f59e0b; color: white; padding: 12px 28px; text-decoration: none; border-radius: 8px;">
              Check Status
            </a>
          </div>
        </div>
      `,
        },
        // 6. Password Reset Success Notification
        'password-reset-success': {
            subject: 'Your Devcore Password Has Been Reset',
            html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 30px; background: #f0fdf4;">
      <div style="background: white; padding: 30px; border-radius: 12px; border: 2px solid #bbf7d0; text-align: center;">
        <h2 style="color: #16a34a;">Password Reset Successful!</h2>
        <p>Hi <strong>${data.user?.firstName || 'there'}</strong>,</p>
        <p>Your password has been successfully reset.</p>
        <p style="color: #dc2626; font-weight: bold;">
          If you did not make this change, please contact support immediately.
        </p>
        <a href="${frontendUrl}/profile/security" style="background: #16a34a; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; margin-top: 20px;">
          Review Security Settings
        </a>
      </div>
    </div>
  `,
        },
        // 7. message received Notification
        'message-received-client': {
            subject: 'Your Message Has Been Received Successfully',
            html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 30px; background: #f0fdf4;">
      <div style="background: white; padding: 30px; border-radius: 12px; border: 2px solid #bbf7d0; text-align: center;">
        <h2 style="color: #16a34a;">Message Recieved Successful!</h2>
        <p>Hi <strong>${data.user?.firstName || 'there'}</strong>,</p>
        <p></p>
        <p style="color: #dc2626; font-weight: bold;">
          If you did not make this change, please contact support immediately.
        </p>
        <a href="${frontendUrl}/profile/security" style="background: #16a34a; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; margin-top: 20px;">
          Review Security Settings
        </a>
      </div>
    </div>
  `,
        },
        // Customer Contact Enquiry Notification
        'new-contact-inquiry': {
            subject: `🔔 New Contact Form Inquiry from ${data.name}`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 30px; background: #fef3c7;">
          <div style="background: white; padding: 30px; border-radius: 12px; border: 2px solid #fbbf24;">
            <h2 style="color: #92400e;">🔔 New Contact Form Submission</h2>
            <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 8px 0;"><strong>Name:</strong> ${data.name}</p>
              <p style="margin: 8px 0;"><strong>Email:</strong> <a href="mailto:${data.email}">${data.email}</a></p>
              ${data.company ? `<p style="margin: 8px 0;"><strong>Company:</strong> ${data.company}</p>` : ''}
              ${data.service ? `<p style="margin: 8px 0;"><strong>Service Interest:</strong> ${data.service}</p>` : ''}
            </div>
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Message:</strong></p>
              <p style="color: #374151; white-space: pre-wrap;">${data.message}</p>
            </div>
            <a href="${frontendUrl}/dashboard/admin/contact/${data.messageId}" style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              View in Dashboard
            </a>
          </div>
        </div>
      `,
        },
        // Add to your templates object
        'reply-to-contact': {
            subject: `Re: Your Inquiry - ${data.subject || 'Devcore'}`,
            html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 30px; background: #f8fafc;">
      <div style="background: white; padding: 30px; border-radius: 12px; border: 2px solid #e2e8f0;">
        <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px;">
          <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 10px; display: flex; align-items: center; justify-content: center;">
            <span style="color: white; font-weight: bold; font-size: 20px;">D</span>
          </div>
          <div>
            <h2 style="margin: 0; color: #1e293b;">Devcore Support Team</h2>
            <p style="margin: 5px 0 0; color: #64748b;">${data.replyFrom || 'Devcore Customer Support'}</p>
          </div>
        </div>
        
        <div style="border-left: 4px solid #6366f1; padding-left: 20px; margin: 30px 0;">
          <p style="color: #64748b; margin: 5px 0;"><strong>Original Message:</strong></p>
          <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; margin: 10px 0; font-style: italic; color: #475569;">
            "${data.originalMessage}"
          </div>
        </div>
        
        <div style="margin: 30px 0;">
          <p style="color: #1e293b; font-size: 16px; line-height: 1.6; white-space: pre-wrap;">${data.replyMessage}</p>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
          <p style="color: #64748b; margin: 5px 0;"><strong>Best regards,</strong></p>
          <p style="color: #1e293b; margin: 5px 0;">${data.replyFrom || 'Devcore Support Team'}</p>
          <p style="color: #64748b; margin: 5px 0;">
            <a href="${process.env.FRONTEND_URL}" style="color: #6366f1; text-decoration: none;">${process.env.FRONTEND_URL}</a>
          </p>
        </div>
      </div>
    </div>
  `,
        }
    };
    const template = templates[type];
    if (!template) {
        throw new Error(`Email template "${type}" not found`);
    }
    const { subject, html } = templates[type];
    await transporter.sendMail({
        from: `"Devcore" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to,
        subject,
        html,
    });
    console.log(`Email sent → ${type} → ${to}`);
};
exports.sendEmail = sendEmail;
