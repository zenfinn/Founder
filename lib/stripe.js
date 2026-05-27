import Stripe from "stripe";
import { getStripeSecretKey } from "./stripe-env.js";

export function createStripeClient() {
  return new Stripe(getStripeSecretKey());
}
