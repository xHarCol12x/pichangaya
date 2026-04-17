"use client";

import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { ReactNode } from "react";

const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = key ? loadStripe(key) : null;

export function StripeProvider({ children }: { children: ReactNode }) {
    if (!stripePromise) return <>{children}</>;
    return <Elements stripe={stripePromise}>{children}</Elements>;
}
