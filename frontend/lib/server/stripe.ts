import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripe() {
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) return null;

  stripeClient ??= new Stripe(apiKey);
  return stripeClient;
}
