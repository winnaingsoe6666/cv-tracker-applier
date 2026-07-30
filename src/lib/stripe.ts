/**
 * Stripe singleton client.
 * Import this wherever you need to call the Stripe API server-side.
 * Returns null (gracefully) if STRIPE_SECRET_KEY is not set — callers
 * should return a 503 or "billing unavailable" response in that case.
 */
import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!_stripe) {
    _stripe = new Stripe(key, { apiVersion: "2026-07-29.dahlia" });
  }
  return _stripe;
}

export const STRIPE_PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID ?? "";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
