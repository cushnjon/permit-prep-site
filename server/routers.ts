import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import Stripe from "stripe";
import { STRIPE_CONFIG } from "./products";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { subscriptions, users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Stripe donation subscription
  donation: router({
    createCheckoutSession: publicProcedure.mutation(async ({ ctx }) => {

      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });
        }

        // Create or retrieve Stripe customer
        let stripeCustomerId: string | undefined;
        let userId: string | undefined;

        if (ctx.user) {
          stripeCustomerId = ctx.user.stripeCustomerId || undefined;
          userId = ctx.user.id.toString();

          if (!stripeCustomerId) {
            const customer = await stripe.customers.create({
              email: ctx.user.email || undefined,
              name: ctx.user.name || undefined,
              metadata: {
                userId: ctx.user.id.toString(),
              },
            });
            stripeCustomerId = customer.id;

            // Save Stripe customer ID to database
            await db
              .update(users)
              .set({ stripeCustomerId })
              .where(eq(users.id, ctx.user.id));
          }
        } else {
          // For unauthenticated users, create a guest customer
          const customer = await stripe.customers.create({
            metadata: {
              userType: "guest",
            },
          });
          stripeCustomerId = customer.id;
        }

        // Create checkout session
        const origin = ctx.req.headers.origin || "https://permitprep.online";
        const session = await stripe.checkout.sessions.create({
          customer: stripeCustomerId,
          mode: "subscription",
          payment_method_types: ["card"],
          line_items: [
            {
              price_data: {
                currency: "usd",
                product_data: {
                  name: "Permit Prep Supporter",
                  description: "Support Permit Prep with a monthly donation",
                },
                unit_amount: 100,
                recurring: {
                  interval: "month",
                },
              },
              quantity: 1,
            },
          ],
          success_url: `${origin}/?donation=success`,
          cancel_url: `${origin}/?donation=canceled`,
          allow_promotion_codes: true,
          metadata: {
            userId: userId || "guest",
            customerEmail: ctx.user?.email || "",
            customerName: ctx.user?.name || "",
          },
        } as any);

        return {
          checkoutUrl: session.url,
        };
      } catch (error) {
        console.error("[Stripe] Checkout session creation failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create checkout session",
        });
      }
    }),

    getSubscriptionStatus: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) {
        return { isSubscribed: false, subscription: null };
      }

      try {
        const db = await getDb();
        if (!db) {
          return { isSubscribed: false, subscription: null };
        }

        const userSubscriptions = await db
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.userId, ctx.user.id))
          .limit(1);

        if (userSubscriptions.length === 0) {
          return { isSubscribed: false, subscription: null };
        }

        const subscription = userSubscriptions[0];
        const isActive = subscription.status === "active";

        return {
          isSubscribed: isActive,
          subscription: {
            id: subscription.stripeSubscriptionId,
            status: subscription.status,
            currentPeriodEnd: subscription.currentPeriodEnd,
          },
        };
      } catch (error) {
        console.error("[Stripe] Failed to get subscription status:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve subscription status",
        });
      }
    }),
  }),
});

export type AppRouter = typeof appRouter;
