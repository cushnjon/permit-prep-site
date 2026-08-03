/**
 * Stripe Products and Prices Configuration
 * Define all products and prices here for centralized management
 */

export const DONATION_PRODUCT = {
  name: "Permit Prep Supporter",
  description: "Support Permit Prep with a monthly donation",
};

// Price ID for $1/month donation subscription
// This should be set from environment variables in production
export const DONATION_PRICE_ID = process.env.STRIPE_DONATION_PRICE_ID || "price_1QhGqVBaJtWUDa4kPM8Yk9Zt"; // Replace with actual price ID

export const STRIPE_CONFIG = {
  donationPriceId: DONATION_PRICE_ID,
  currency: "usd",
  interval: "month",
  amount: 100, // $1.00 in cents
};
