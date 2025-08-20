import { Router } from "express";
import {
  sendVerificationEmail,
  verifyEmail,
  verifyEmailByLink,
  resendVerificationCode
} from "../controllers/emailverification.controller.js";

const router = Router();

router.route("/send").post(sendVerificationEmail);
router.route("/verify").post(verifyEmail);
router.route("/verify-link/:token").get(verifyEmailByLink);
router.route("/resend").post(resendVerificationCode);

export default router;
