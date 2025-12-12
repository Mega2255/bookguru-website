// src/routes/subscriptionRoutes.js
import express from "express";
import axios from "axios";
import { PrismaClient } from "@prisma/client";
import { auth } from "../middleware/auth.js";

const router = express.Router();
const prisma = new PrismaClient();

// Load ENV keys
const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
const CALLBACK_URL = process.env.SUBSCRIPTION_CALLBACK_URL;

// ===============================
// 1️⃣ CREATE SUBSCRIPTION PAYMENT
// ===============================
router.post("/create", auth, async (req, res) => {
  try {
    console.log("🔥 HIT /api/subscription/create");

    const { plan } = req.body;

    if (!plan || !["monthly", "yearly"].includes(plan)) {
      return res.status(400).json({ message: "Invalid plan type" });
    }

    if (!req.user || !req.user.email) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const amount =
  plan === "monthly"
    ? Number(process.env.MONTHLY_PRICE) * 100
    : Number(process.env.YEARLY_PRICE) * 100;

    const payload = {
      email: req.user.email,
      amount,
      callback_url: CALLBACK_URL,
      metadata: {
        userId: req.user.id,
        plan,
      },
    };

    console.log("➡️ Sending to Paystack:", payload);

    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      payload,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Paystack initialize response:", response.data);

    return res.json({
      authorization_url: response.data.data.authorization_url,
      reference: response.data.data.reference,
    });
  } catch (error) {
    console.log("❌ ERROR IN /create:", error.response?.data || error.message);
    return res.status(500).json({
      message: "Payment initialization failed",
      error: error.response?.data || error.message,
    });
  }
});

// ===============================
// 2️⃣ VERIFY PAYMENT
// ===============================
router.get("/verify/:reference", async (req, res) => {
  try {
    const { reference } = req.params;
    console.log("🔍 Verifying:", reference);

    // ✅ FIXED PAYSTACK VERIFY URL
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
      }
    );

    const data = response.data.data;
    console.log("✅ Verification data:", data);

    if (data.status !== "success") {
      return res.status(400).json({ message: "Payment not successful" });
    }

    let { userId, plan } = data.metadata;
    userId = Number(userId);

    // Calculate expiry
    const now = new Date();
    const expiresAt =
      plan === "monthly"
        ? new Date(now.setMonth(now.getMonth() + 1))
        : new Date(now.setFullYear(now.getFullYear() + 1));

    console.log("➡️ Saving subscription:", {
      userId,
      plan,
      amount: data.amount / 100,
      expiresAt,
    });

    await prisma.subscription.create({
      data: {
        userId,
        plan,
        amount: data.amount / 100,
        expiresAt,
      },
    });

    return res.json({
      message: "Subscription successful!",
      plan,
      expiresAt,
    });
  } catch (error) {
    console.log("❌ VERIFY ERROR:", error.response?.data || error.message);

    return res.status(500).json({
      message: "Verification failed",
      error: error.response?.data || error.message,
    });
  }
});

// ===============================
// 3️⃣ CHECK SUBSCRIPTION STATUS
// ===============================
router.get("/status", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const subscription = await prisma.subscription.findFirst({
      where: { userId },
      orderBy: { expiresAt: "desc" },
    });

    if (!subscription) {
      return res.json({ active: false });
    }

    const now = new Date();
    const isActive = subscription.expiresAt > now;

    return res.json({
      active: isActive,
      plan: subscription.plan,
      expiresAt: subscription.expiresAt,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Could not check subscription status",
      error: error.message,
    });
  }
});

export default router;
