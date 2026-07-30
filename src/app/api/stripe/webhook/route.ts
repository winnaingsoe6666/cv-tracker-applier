import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { db } from "@/lib/db";

/**
 * POST /api/stripe/webhook
 * Handles Stripe webhook events. Verifies signature before processing.
 *
 * Events handled:
 *   checkout.session.completed  → upgrade user to PRO
 *   customer.subscription.deleted → downgrade user to FREE
 */
export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured." }, { status: 503 });
  }

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing signature." }, { status: 400 });

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("[stripe/webhook] signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const userId = session.metadata?.userId;
      if (!userId) break;

      await db.user.update({
        where: { id: userId },
        data: {
          plan: "PRO",
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: session.subscription as string,
        },
      });
      console.log(`[stripe/webhook] User ${userId} upgraded to PRO`);
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object;
      const customerId = sub.customer as string;
      await db.user.updateMany({
        where: { stripeCustomerId: customerId },
        data: { plan: "FREE", stripeSubscriptionId: null },
      });
      console.log(`[stripe/webhook] Customer ${customerId} downgraded to FREE`);
      break;
    }

    default:
      // Unhandled event — log and return 200 to prevent Stripe from retrying
      console.log(`[stripe/webhook] Unhandled event: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
