import express from "express";
const router = express.Router();
import {
  loginUser,
  otpSignup,
  registerUser,
  verityEmail,
  verifyOTP,
} from "../controller/auth.controller.js";

router.post("/login", loginUser);
router.post("/register", registerUser);
router.get("/verifyEmail", verityEmail);
router.post("/otpSignup", otpSignup);
router.post("/verifyOTP", verifyOTP);

export default router;
