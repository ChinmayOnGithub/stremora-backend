import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.models.js";
import { emailService } from "../utils/emailService.js";
import crypto from 'crypto';

// Generate verification token for email links (optional backup)
const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Send verification email with BOTH code and link
const sendVerificationEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email?.trim()) {
    throw new ApiError(400, "Email is required");
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      throw new ApiError(404, "User not found with this email");
    }

    if (user.isEmailVerified) {
      return res.status(200).json(
        new ApiResponse(200, null, "Email is already verified")
      );
    }

    // Generate BOTH verification code AND token
    const verificationCode = user.generateEmailVerificationToken();

    // Also generate a secure token for link-based verification
    const verificationToken = generateVerificationToken();
    user.emailVerificationLinkToken = verificationToken;

    await user.save({ validateBeforeSave: false });

    // Get frontend URL from request origin or fallback to env
    const origin = req.get('origin') || req.get('referer') || process.env.FRONTEND_URL || 'http://localhost:5173';
    const frontendUrl = origin.replace(/\/$/, '').split('?')[0].split('#')[0];

    // Send email with both options
    await emailService.sendVerificationEmail(
      user.email,
      verificationCode,
      user.fullname,
      verificationToken, // Pass token for link generation
      frontendUrl // Pass dynamic frontend URL
    );

    res.status(200).json(
      new ApiResponse(
        200,
        {
          email: user.email,
          expiresIn: '15 minutes',
          methods: ['code', 'link']
        },
        "Verification email sent successfully"
      )
    );

  } catch (error) {
    console.error("Error sending verification email:", error);

    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(500, "Failed to send verification email");
  }
});

// Verify email with code (primary method)
const verifyEmail = asyncHandler(async (req, res) => {
  const { email, verificationCode } = req.body;

  if (!email?.trim()) {
    throw new ApiError(400, "Email is required");
  }

  if (!verificationCode?.trim()) {
    throw new ApiError(400, "Verification code is required");
  }

  if (!/^\d{6}$/.test(verificationCode.trim())) {
    throw new ApiError(400, "Invalid verification code format");
  }

  try {
    const user = await User.findOne({
      email: email.toLowerCase(),
      emailVerificationToken: verificationCode.trim()
    });

    if (!user) {
      throw new ApiError(400, "Invalid verification code");
    }

    if (user.isEmailVerified) {
      return res.status(200).json(
        new ApiResponse(200, { isVerified: true }, "Email is already verified")
      );
    }

    if (!user.emailVerificationExpires || user.emailVerificationExpires < new Date()) {
      throw new ApiError(400, "Verification code has expired. Please request a new one");
    }

    // Verify the email
    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    user.emailVerificationLinkToken = null; // Clear link token too

    await user.save({ validateBeforeSave: false });

    // Get frontend URL from request origin or fallback to env
    const origin = req.get('origin') || req.get('referer') || process.env.FRONTEND_URL || 'http://localhost:5173';
    const frontendUrl = origin.replace(/\/$/, '').split('?')[0].split('#')[0];

    // Send welcome email (non-blocking)
    emailService.sendWelcomeEmail(user.email, user.fullname, frontendUrl).catch(err => {
      console.error('Welcome email failed:', err);
    });

    res.status(200).json(
      new ApiResponse(
        200,
        {
          isVerified: true,
          email: user.email,
          canLogin: true
        },
        "Email verified successfully! You can now log in."
      )
    );

  } catch (error) {
    console.error("Email verification error:", error);

    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(500, "Email verification failed");
  }
});

// Verify email with link token (backup method)
const verifyEmailByLink = asyncHandler(async (req, res) => {
  const { token } = req.params;

  if (!token?.trim()) {
    throw new ApiError(400, "Invalid verification link");
  }

  try {
    const user = await User.findOne({
      emailVerificationLinkToken: token.trim()
    });

    // Get frontend URL from request origin or fallback to env
    const origin = req.get('origin') || req.get('referer') || process.env.FRONTEND_URL || 'http://localhost:5173';
    const frontendUrl = origin.replace(/\/$/, '').split('?')[0].split('#')[0];

    if (!user) {
      return res.redirect(`${frontendUrl}/verification/invalid`);
    }

    if (user.isEmailVerified) {
      return res.redirect(`${frontendUrl}/verification/already-verified`);
    }

    if (!user.emailVerificationExpires || user.emailVerificationExpires < new Date()) {
      return res.redirect(`${frontendUrl}/verification/expired`);
    }

    // Verify the email
    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    user.emailVerificationLinkToken = null;

    await user.save({ validateBeforeSave: false });

    // Send welcome email (non-blocking)
    emailService.sendWelcomeEmail(user.email, user.fullname, frontendUrl).catch(err => {
      console.error('Welcome email failed:', err);
    });

    // Redirect to success page
    return res.redirect(`${frontendUrl}/verification/success`);

  } catch (error) {
    console.error("Link verification error:", error);
    // Get frontend URL from request origin or fallback to env
    const origin = req.get('origin') || req.get('referer') || process.env.FRONTEND_URL || 'http://localhost:5173';
    const frontendUrl = origin.replace(/\/$/, '').split('?')[0].split('#')[0];
    return res.redirect(`${frontendUrl}/verification/error`);
  }
});

const resendVerificationCode = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email?.trim()) {
    throw new ApiError(400, "Email is required");
  }

  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    // Send a generic message to prevent exposing which emails are registered
    return res.status(200).json(new ApiResponse(200, null, "If an account with this email exists, a new verification code has been sent."));
  }

  if (user.isEmailVerified) {
    return res.status(200).json(new ApiResponse(200, null, "This email is already verified."));
  }

  // Generate a new verification code and expiry date
  const verificationCode = user.generateEmailVerificationToken();
  // Your `generateVerificationToken` method should also handle the link token if you use it
  // For simplicity, this example focuses on the code.

  await user.save({ validateBeforeSave: false });

  // Get frontend URL from request origin or fallback to env
  const origin = req.get('origin') || req.get('referer') || process.env.FRONTEND_URL || 'http://localhost:5173';
  const frontendUrl = origin.replace(/\/$/, '').split('?')[0].split('#')[0];

  // Send the new code via email
  await emailService.sendVerificationEmail(
    user.email,
    verificationCode,
    user.fullname,
    null,
    frontendUrl
  );

  return res.status(200).json(new ApiResponse(200, null, "A new verification code has been sent to your email."));
});


export {
  sendVerificationEmail,
  verifyEmail,
  verifyEmailByLink,
  resendVerificationCode
};
