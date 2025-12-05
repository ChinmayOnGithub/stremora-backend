import nodemailer from 'nodemailer';
import { ApiError } from './ApiError.js';

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({  // ← Fixed: createTransport (not createTransporter)
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Verify connection configuration
    this.transporter.verify((error, success) => {
      if (error) {
        console.error('[EMAIL] Configuration error:', error.message);
      } else {
        console.log('[EMAIL] Service initialized and ready');
      }
    });
  }

  async sendVerificationEmail(email, verificationCode, fullname, verificationToken = null, frontendUrl = null) {
    try {
      const baseUrl = frontendUrl || process.env.FRONTEND_URL || 'http://localhost:5173';
      const verificationLink = verificationToken
        ? `${baseUrl}/api/v1/email/verify-link/${verificationToken}`
        : null;

      const mailOptions = {
        from: {
          name: 'STREMORA',
          address: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER
        },
        to: email,
        subject: 'Verify Your STREMORA Account',
        html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
                        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                            <div style="text-align: center; margin-bottom: 30px;">
                                <h1 style="color: #333; margin: 0; font-size: 28px;">STREMORA</h1>
                                <p style="color: #666; margin: 10px 0 0 0; font-size: 16px;">Welcome to the community!</p>
                            </div>
                            
                            <h2 style="color: #333; text-align: center; margin-bottom: 20px;">Verify Your Email Address</h2>
                            
                            <p style="color: #555; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
                                Hi ${fullname},
                            </p>
                            
                            <p style="color: #555; font-size: 16px; line-height: 1.5; margin-bottom: 30px;">
                                Thank you for signing up with STREMORA! Please verify your email address using either method below:
                            </p>
                            
                            <!-- Primary Method: Code -->
                            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                <h3 style="color: #333; margin: 0 0 15px 0; text-align: center;">Method 1: Enter this code</h3>
                                <div style="text-align: center; margin: 20px 0;">
                                    <div style="display: inline-block; background-color: #fff; padding: 15px 25px; border-radius: 8px; border: 2px solid #007bff;">
                                        <span style="font-size: 24px; font-weight: bold; color: #007bff; letter-spacing: 3px; font-family: 'Courier New', monospace;">
                                            ${verificationCode}
                                        </span>
                                    </div>
                                </div>
                                <p style="color: #666; text-align: center; font-size: 14px; margin: 0;">
                                    Enter this code on the verification page
                                </p>
                            </div>
                            
                            ${verificationLink ? `
                            <!-- Secondary Method: One-Click -->
                            <div style="text-align: center; margin: 30px 0;">
                                <p style="color: #666; font-size: 14px; margin-bottom: 15px;">Or verify with one click:</p>
                                <a href="${verificationLink}" 
                                   style="display: inline-block; background-color: #28a745; color: white; padding: 12px 30px; 
                                          text-decoration: none; border-radius: 5px; font-weight: bold;">
                                    ✓ Verify Email Instantly
                                </a>
                            </div>
                            ` : ''}
                            
                            <p style="color: #666; font-size: 14px; text-align: center; margin-top: 30px;">
                                This verification expires in 15 minutes for security.
                            </p>
                            
                            <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107; margin: 20px 0;">
                                <p style="color: #856404; margin: 0; font-size: 14px;">
                                    <strong>Security Note:</strong> If you didn't create an account with STREMORA, please ignore this email.
                                </p>
                            </div>
                            
                            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                                <p style="color: #999; font-size: 14px; margin: 0;">
                                    Need help? Contact us at <a href="mailto:support@stremora.com" style="color: #007bff;">support@stremora.com</a>
                                </p>
                            </div>
                        </div>
                    </div>
                `
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Verification email sent successfully:', result.messageId);
      return result;

    } catch (error) {
      console.error('Error sending verification email:', error);
      throw new ApiError(500, 'Failed to send verification email');
    }
  }

  async sendWelcomeEmail(email, fullname, frontendUrl = null) {
    try {
      const baseUrl = frontendUrl || process.env.FRONTEND_URL || 'http://localhost:5173';
      const mailOptions = {
        from: {
          name: 'STREMORA',
          address: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER
        },
        to: email,
        subject: 'Welcome to STREMORA! 🎉',
        html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
                        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                            <div style="text-align: center; margin-bottom: 30px;">
                                <h1 style="color: #333; margin: 0; font-size: 28px;">🎉 Welcome to STREMORA!</h1>
                            </div>
                            
                            <p style="color: #555; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
                                Hi ${fullname},
                            </p>
                            
                            <p style="color: #555; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
                                Your account has been successfully verified! Welcome to the STREMORA community. 
                                You can now start exploring, uploading, and sharing amazing content.
                            </p>
                            
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${baseUrl}" 
                                   style="display: inline-block; background-color: #007bff; color: white; padding: 12px 30px; 
                                          text-decoration: none; border-radius: 5px; font-weight: bold;">
                                    Start Exploring
                                </a>
                            </div>
                            
                            <p style="color: #555; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
                                If you have any questions or need assistance, feel free to reach out to our support team.
                            </p>
                            
                            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                                <p style="color: #999; font-size: 14px; margin: 0;">
                                    Happy streaming! 📺<br>
                                    The STREMORA Team
                                </p>
                            </div>
                        </div>
                    </div>
                `
      };
      console.log('GMAIL SMTP setup', process.env.SMTP_USER, process.env.SMTP_PASS && '********');

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Welcome email sent successfully:', result.messageId);
      return result;

    } catch (error) {
      console.error('Error sending welcome email:', error);
      // Don't throw error for welcome email failure
      console.log('Welcome email failed, but continuing...');
    }
  }
}

export const emailService = new EmailService();

// Generic sendEmail function for custom emails
export const sendEmail = async ({ to, subject, html }) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: {
        name: 'STREMORA',
        address: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER
      },
      to,
      subject,
      html
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('[EMAIL] Email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('[EMAIL] Error sending email:', error);
    throw new ApiError(500, 'Failed to send email');
  }
};
