import { NextResponse } from "next/server";
import { getStripe, STRIPE_PRO_PRICE_ID, APP_URL } from "@/lib/stripe";
import { apiUserId } from "@/lib/session";
import { db } from "@/lib/db";

/**
 * POST /api/stripe/checkout
 * Creates a Stripe Checkout session for the PRO plan.
 * Redirects the browser to the Stripe-hosted payment page.
 */
export async function POST() {
  const userId = await apiUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const stripe = getStripe();
  if (!stripe || !STRIPE_PRO_PRICE_ID) {
    return NextResponse.json(
      { error: "Billing is not configured. Set STRIPE_SECRET_KEY and STRIPE_PRO_PRICE_ID." },
      { status: 503 }
    );
  }

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (user.plan === "PRO") {
    return NextResponse.json({ error: "Already on PRO plan." }, { status: 409 });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: STRIPE_PRO_PRICE_ID, quantity: 1 }],
    customer_email: user.stripeCustomerId ? undefined : user.email,
    customer: user.stripeCustomerId ?? undefined,
    success_url: `${APP_URL}/settings?upgraded=1`,
    cancel_url: `${APP_URL}/settings`,
    metadata: { userId },
    subscription_data: {
      metadata: { userId },
    },
  });

  return NextResponse.json({ url: session.url });
}
