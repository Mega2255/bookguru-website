import paystack from "../utils/paystack.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ===== GENERATE PAYMENT LINK =====
export const createSubscription = async (req, res) => {
  try {
    const { plan } = req.body;
    const userId = req.user.id; // From JWT

    if (!["monthly", "yearly"].includes(plan))
      return res.status(400).json({ message: "Invalid plan" });

    const amount =
  plan === "monthly"
    ? Number(process.env.MONTHLY_PRICE)
    : Number(process.env.YEARLY_PRICE);


    const paystackRes = await paystack.post("/transaction/initialize", {
      email: req.user.email,
      amount: amount * 100,
      callback_url: `${process.env.BACKEND_URL}/api/subscription/verify`,
      metadata: {
        userId,
        plan,
      },
    });

    return res.json({
      authorization_url: paystackRes.data.data.authorization_url,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Payment initialization failed" });
  }
};

// ===== VERIFY PAYMENT AFTER REDIRECT =====
export const verifySubscription = async (req, res) => {
  try {
    const { reference } = req.query;

    const verifyRes = await paystack.get(`/transaction/verify/${reference}`);
    const data = verifyRes.data.data;

    if (data.status !== "success")
      return res.status(400).json({ message: "Payment failed" });

    const userId = data.metadata.userId;
    const plan = data.metadata.plan;

    // Set expiry
    const now = new Date();
    let expiresAt = new Date();

    if (plan === "monthly") {
      expiresAt.setMonth(now.getMonth() + 1);
    } else if (plan === "yearly") {
      expiresAt.setFullYear(now.getFullYear() + 1);
    }

    await prisma.subscription.create({
      data: {
        userId,
        amount: data.amount / 100,
        plan,
        expiresAt,
      },
    });

    return res.redirect(`${process.env.FRONTEND_URL}/subscription-success`);
  } catch (error) {
    return res.status(500).json({ message: "Verification failed" });
  }
};

// ===== CHECK IF USER HAS ACTIVE SUBSCRIPTION =====
export const checkSubscription = async (req, res) => {
  try {
    const userId = req.user.id;

    const active = await prisma.subscription.findFirst({
      where: {
        userId,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: { expiresAt: "desc" },
    });

    if (!active) {
      return res.json({ active: false });
    }

    return res.json({
      active: true,
      plan: active.plan,
      expiresAt: active.expiresAt,
    });
  } catch (error) {
    return res.status(500).json({ message: "Error checking subscription" });
  }
};
