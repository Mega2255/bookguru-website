import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const requireSubscription = async (req, res, next) => {
  try {
    const userId = req.user.id; // user injected by auth.js

    // 🎉 PROMO PERIOD: Free access until January 8th, 2025
    const PROMO_END_DATE = new Date("2025-01-08T23:59:59Z"); // End of day Jan 8th, 2025
    const now = new Date();

    // If we're still in promo period, grant access to everyone
    if (now < PROMO_END_DATE) {
      return next(); // Allow access during promo - no subscription needed!
    }

    // After promo period ends (January 9th onwards), check for active subscription
    const active = await prisma.subscription.findFirst({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
    });

    if (!active) {
      return res.status(403).json({
        message: "Subscription required",
      });
    }

    next(); // Allow the request to continue
  } catch (error) {
    return res.status(500).json({ message: "Subscription check failed" });
  }
};