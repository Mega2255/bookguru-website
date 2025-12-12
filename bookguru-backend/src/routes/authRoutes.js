import express from "express";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendEmail } from "../utils/sendEmail.js";
import { registerUser, loginUser } from "../controllers/authController.js";

const prisma = new PrismaClient();
const router = express.Router();

/* ============================
   REGISTER & LOGIN ROUTES
============================= */
router.post("/register", registerUser);
router.post("/login", loginUser);

/* ============================
   FORGOT PASSWORD (send email)
============================= */
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });

  // Do not reveal whether email exists
  if (!user) return res.json({ message: "Reset link sent if email exists." });

  // Generate token
  const resetToken = crypto.randomBytes(32).toString("hex");
  const hashed = crypto.createHash("sha256").update(resetToken).digest("hex");

  // Save token
  await prisma.passwordReset.create({
    data: {
      userId: user.id,
      token: hashed,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    },
  });

  const resetURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

  // send email
  await sendEmail({
    to: email,
    subject: "Password Reset Request",
    message: `
      Click the link below to reset your password:<br><br>
      <a href="${resetURL}" target="_blank">${resetURL}</a><br><br>
      This link expires in 10 minutes.
    `,
  });

  res.json({ message: "Reset link sent to your email." });
});

/* ============================
   RESET PASSWORD
============================= */
router.post("/reset-password/:token", async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const hashed = crypto.createHash("sha256").update(token).digest("hex");

  const resetRecord = await prisma.passwordReset.findFirst({
    where: {
      token: hashed,
      expiresAt: {
        gt: new Date(),
      },
    },
  });

  if (!resetRecord)
    return res.status(400).json({ message: "Invalid or expired token" });

  const newHashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.update({
    where: { id: resetRecord.userId },
    data: { password: newHashedPassword },
  });

  await prisma.passwordReset.delete({
    where: { id: resetRecord.id },
  });

  res.json({ message: "Password reset successful. You can now log in." });
});

export default router;
