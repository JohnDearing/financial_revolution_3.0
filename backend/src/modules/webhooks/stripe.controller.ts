import { NextFunction, Request, Response } from "express";
import { env, stripe } from "../../config/index.js";
import { processStripeMembershipEvent } from "../member/member.service.js";

export async function stripeWebhookController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!stripe || !env.stripeWebhookSecret) {
      res.status(501).json({
        success: false,
        message: "Stripe webhook is not configured",
      });
      return;
    }

    const signature = req.headers["stripe-signature"];
    if (!signature) {
      res.status(400).json({ success: false, message: "Missing Stripe signature" });
      return;
    }

    const event = stripe.webhooks.constructEvent(
      req.body as Buffer,
      signature,
      env.stripeWebhookSecret,
    );
    await processStripeMembershipEvent(event);

    res.json({ received: true });
  } catch (error) {
    next(error);
  }
}
