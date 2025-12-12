import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const requireSubscription = async (req, res, next) => {
  try {
    const userId = req.user.id; // user injected by auth.js

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
