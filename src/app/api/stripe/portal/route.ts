import { NextResponse } from "next/server";
import { getStripe, APP_URL } from "@/lib/stripe";
import { apiUserId } from "@/lib/session";
import { db } from "@/lib/db";

/**
 * POST /api/stripe/portal
 * Creates a Stripe Customer Portal session for managing/cancelling subscriptions.
 * Only available to PRO users who have a stripeCustomerId.
 */
export async function POST() {
  const userId = await apiUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Billing not configured." }, { status: 503 });
  }

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user?.stripeCustomerId) {
    return NextResponse.json({ error: "No billing account found." }, { status: 404 });
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${APP_URL}/settings`,
  });

  return NextResponse.json({ url: session.url });
}
