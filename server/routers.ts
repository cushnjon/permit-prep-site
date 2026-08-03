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
import { generateCertificatePDF } from "./certificateGenerator";

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

  // Certificate generation
  certificate: router({
    generate: publicProcedure
      .input(
        z.object({
          questionCount: z.number().refine((n) => n === 50 || n === 100),
          userName: z.string().min(1).max(100),
          score: z.number().min(0),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const pdfBuffer = await generateCertificatePDF(
            input.questionCount,
            input.userName,
            input.score
          );

          // Return base64 encoded PDF for download
          const base64 = pdfBuffer.toString('base64');
          const filename = `Safety_Certificate_${input.questionCount}Q_${Date.now()}.pdf`;

          return {
            success: true,
            pdf: base64,
            filename,
          };
        } catch (error) {
          console.error("[Certificate] Generation failed:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to generate certificate",
          });
        }
      }),
  }),

  // Debug endpoint for testing
  debug: router({
    generateTestProgress: publicProcedure
      .input(
        z.object({
          pin: z.string(),
          correctAnswers: z.number().min(0).max(100),
          totalQuestions: z.number().refine((n) => n === 50 || n === 100),
        })
      )
      .query(({ input }) => {
        // Generate test data
        const selectedAnswers: Record<number, string> = {};
        for (let i = 0; i < input.correctAnswers; i++) {
          selectedAnswers[i] = 'a';
        }

        const selectedQuestions = Array.from({ length: input.totalQuestions }, (_, i) => ({
          id: `Q_CERT_${i + 1}`,
          prompt: `Debug Question ${i + 1}`,
          a: `Option A`,
          b: `Option B`,
          c: `Option C`,
          d: `Option D`,
          correct_answer: i < input.correctAnswers ? 'a' : 'b',
        }));

        const testState = {
          mode: "testing",
          questionCount: input.totalQuestions,
          currentQuestionIndex: input.correctAnswers,
          score: input.correctAnswers,
          selectedAnswers,
          userName: "",
          savePin: input.pin,
        };

        const progressData = {
          testState,
          selectedQuestions,
          timestamp: new Date().toISOString(),
        };

        return {
          success: true,
          pin: input.pin,
          data: progressData,
          instructions: `Open browser DevTools (F12), go to Application > Local Storage, find your domain, and add a new entry with key: test_progress_${input.pin} and value: ${JSON.stringify(progressData)}`,
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
