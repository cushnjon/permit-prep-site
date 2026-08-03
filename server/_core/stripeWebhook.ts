import express from "express";
import Stripe from "stripe";
import { getDb } from "../db";
import { subscriptions } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

export function registerStripeWebhook(app: express.Express) {
  // Register webhook BEFORE express.json() to access raw body
  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }),
    async (req, res) => {
      const sig = req.headers["stripe-signature"] as string;
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!webhookSecret) {
        console.error("[Stripe Webhook] Missing STRIPE_WEBHOOK_SECRET");
        return res.status(400).json({ error: "Webhook secret not configured" });
      }

      let event: Stripe.Event;

      try {
        event = stripe.webhooks.constructEvent(
          req.body,
          sig,
          webhookSecret
        );
      } catch (err) {
        console.error("[Stripe Webhook] Signature verification failed:", err);
        return res.status(400).json({ error: "Webhook signature verification failed" });
      }

      // Handle test events
      if (event.id.startsWith("evt_test_")) {
        console.log("[Stripe Webhook] Test event detected, returning verification response");
        return res.json({ verified: true });
      }

      try {
        const db = await getDb();
        if (!db) {
          console.error("[Stripe Webhook] Database not available");
          return res.status(500).json({ error: "Database unavailable" });
        }

        switch (event.type) {
          case "checkout.session.completed": {
            const session = event.data.object as Stripe.Checkout.Session;
            console.log("[Stripe Webhook] Checkout session completed:", session.id);

            if (session.subscription && session.metadata?.user_id) {
              const userId = parseInt(session.metadata.user_id);
              const subscriptionId = session.subscription as string;

              // Retrieve subscription details from Stripe
              const subscription = await stripe.subscriptions.retrieve(subscriptionId) as any;

              // Save subscription to database
              const periodStart = typeof subscription.current_period_start === 'number' 
                ? subscription.current_period_start * 1000 
                : Date.now();
              const periodEnd = typeof subscription.current_period_end === 'number' 
                ? subscription.current_period_end * 1000 
                : Date.now();

              await db.insert(subscriptions).values({
                userId,
                stripeSubscriptionId: subscription.id,
                stripePriceId: subscription.items.data[0]?.price.id || "",
                status: subscription.status,
                currentPeriodStart: new Date(periodStart),
                currentPeriodEnd: new Date(periodEnd),
              });

              console.log(`[Stripe Webhook] Subscription created for user ${userId}`);
            }
            break;
          }

          case "customer.subscription.updated": {
            const subscription = event.data.object as any;
            console.log("[Stripe Webhook] Subscription updated:", subscription.id);

            const periodStart = typeof subscription.current_period_start === 'number' 
              ? subscription.current_period_start * 1000 
              : Date.now();
            const periodEnd = typeof subscription.current_period_end === 'number' 
              ? subscription.current_period_end * 1000 
              : Date.now();

            // Update subscription status in database
            await db
              .update(subscriptions)
              .set({
                status: subscription.status,
                currentPeriodStart: new Date(periodStart),
                currentPeriodEnd: new Date(periodEnd),
              })
              .where(eq(subscriptions.stripeSubscriptionId, subscription.id));

            break;
          }

          case "customer.subscription.deleted": {
            const subscription = event.data.object as Stripe.Subscription;
            console.log("[Stripe Webhook] Subscription deleted:", subscription.id);

            // Mark subscription as canceled
            await db
              .update(subscriptions)
              .set({ status: "canceled" })
              .where(eq(subscriptions.stripeSubscriptionId, subscription.id));

            break;
          }

          case "invoice.paid": {
            const invoice = event.data.object as Stripe.Invoice;
            console.log("[Stripe Webhook] Invoice paid:", invoice.id);
            // Subscription payment successful
            break;
          }

          case "invoice.payment_failed": {
            const invoice = event.data.object as Stripe.Invoice;
            console.log("[Stripe Webhook] Invoice payment failed:", invoice.id);
            // Handle failed payment
            break;
          }

          default:
            console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
        }

        res.json({ received: true });
      } catch (error) {
        console.error("[Stripe Webhook] Error processing event:", error);
        res.status(500).json({ error: "Webhook processing failed" });
      }
    }
  );
}
