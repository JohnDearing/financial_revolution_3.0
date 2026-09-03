import Stripe from "stripe";
import { env } from "./env.js";

export const stripe = env.stripeSecretKey
  ? new Stripe(env.stripeSecretKey, { apiVersion: "2025-12-15.clover" })
  : null;

export function assertStripeConfigured() {
  if (!stripe) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  if (!env.stripeEnrollmentPriceId || !env.stripeMonthlyPriceId) {
    throw new Error(
      "STRIPE_ENROLLMENT_PRICE_ID and STRIPE_MONTHLY_PRICE_ID must be set",
    );
  }
  return stripe;
}
