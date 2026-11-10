import Stripe from "stripe";

const stripeSecretKey =
  process.env.STRIPE_SECRET_KEY || "sk_test_placeholder_key_change_in_production";

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2025-01-27.acacia" as any,
  typescript: true,
});

