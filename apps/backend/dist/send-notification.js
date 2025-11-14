"use strict";
/**
 * Send Notification
 * Monday Code Function
 *
 * Sends email notifications to clients via SendGrid
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = handler;
/**
 * SendGrid email sender
 */
async function sendEmailViaSendGrid(email, apiKey) {
    try {
        const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                personalizations: [{
                        to: [{ email: email.to }],
                        subject: email.subject,
                    }],
                from: {
                    email: process.env.FROM_EMAIL || 'noreply@yourcompany.com',
                    name: process.env.FROM_NAME || 'Support Portal',
                },
                content: [
                    {
                        type: 'text/html',
                        value: email.html,
                    },
                ],
            }),
        });
        return response.ok;
    }
    catch (error) {
        console.error('SendGrid error:', error);
        return false;
    }
}
/**
 * Build email template based on notification type
 */
function buildEmailTemplate(notification) {
    const { type, client_email, data } = notification;
    const portalUrl = process.env.PORTAL_BASE_URL || 'https://portal.yourcompany.com';
    const ticketUrl = `${portalUrl}/tickets/${notification.ticket_id}`;
    let subject = '';
    let html = '';
    switch (type) {
        case 'ticket_created':
            subject = `New Ticket Created: ${data.ticket_title}`;
            html = `
        <h2>Your ticket has been created</h2>
        <p>We've received your support request and will respond soon.</p>
        <p><strong>Ticket:</strong> ${data.ticket_title}</p>
        <p><a href="${ticketUrl}">View Ticket</a></p>
      `;
            break;
        case 'status_changed':
            subject = `Ticket Status Updated: ${data.ticket_title}`;
            html = `
        <h2>Ticket status has been updated</h2>
        <p><strong>Ticket:</strong> ${data.ticket_title}</p>
        <p><strong>Status:</strong> ${data.old_status} → ${data.new_status}</p>
        <p><a href="${ticketUrl}">View Ticket</a></p>
      `;
            break;
        case 'comment_added':
            subject = `New Comment on: ${data.ticket_title}`;
            html = `
        <h2>New comment on your ticket</h2>
        <p><strong>Ticket:</strong> ${data.ticket_title}</p>
        <p><strong>Comment:</strong></p>
        <blockquote>${data.comment_text}</blockquote>
        <p><a href="${ticketUrl}">View Ticket & Reply</a></p>
      `;
            break;
        case 'file_uploaded':
            subject = `New File Uploaded: ${data.ticket_title}`;
            html = `
        <h2>New file uploaded to your ticket</h2>
        <p><strong>Ticket:</strong> ${data.ticket_title}</p>
        <p><strong>File:</strong> ${data.file_name}</p>
        <p><a href="${ticketUrl}">View Ticket</a></p>
      `;
            break;
        default:
            subject = `Update on: ${data.ticket_title}`;
            html = `
        <h2>Your ticket has been updated</h2>
        <p><strong>Ticket:</strong> ${data.ticket_title}</p>
        <p><a href="${ticketUrl}">View Ticket</a></p>
      `;
    }
    // Wrap in branded template
    const brandedHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #0073ea; color: white; padding: 20px; text-align: center; }
        .content { background: white; padding: 30px; }
        .button { display: inline-block; padding: 12px 24px; background: #0073ea; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        blockquote { background: #f5f5f5; border-left: 4px solid #0073ea; padding: 10px 15px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Support Portal</h1>
        </div>
        <div class="content">
          ${html}
        </div>
        <div class="footer">
          <p>This is an automated message from your support portal.</p>
          <p>Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
    return {
        to: client_email,
        subject,
        html: brandedHtml,
    };
}
/**
 * Main handler
 */
async function handler(req) {
    try {
        const notification = JSON.parse(req.body);
        // Get SendGrid API key
        const sendgridKey = process.env.SENDGRID_API_KEY;
        if (!sendgridKey) {
            console.error('SENDGRID_API_KEY not configured');
            return {
                success: false,
                error: {
                    code: 'CONFIGURATION_ERROR',
                    message: 'Email service not configured',
                },
            };
        }
        // Build email
        const email = buildEmailTemplate(notification);
        // Send email
        const sent = await sendEmailViaSendGrid(email, sendgridKey);
        if (!sent) {
            return {
                success: false,
                error: {
                    code: 'EMAIL_SEND_ERROR',
                    message: 'Failed to send email',
                },
            };
        }
        return {
            success: true,
            data: {
                sent: true,
                to: email.to,
                subject: email.subject,
            },
            meta: {
                timestamp: new Date().toISOString(),
            },
        };
    }
    catch (error) {
        console.error('Send notification error:', error);
        return {
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: error instanceof Error ? error.message : 'Unknown error',
            },
        };
    }
}
