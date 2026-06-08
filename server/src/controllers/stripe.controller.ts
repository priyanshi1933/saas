import { Request, Response } from "express";
import { getOrganizationId } from "./helpers";
import {
  constructStripeEvent,
  createStripePaymentSession,
  createStripeSubscriptionSession,
  handleStripeEvent,
} from "../services/stripe.service";

export const createStripePaymentSessionController = async (req: Request, res: Response) => {
  try {
    const organizationId = getOrganizationId(req);
    const { clientName, amount } = req.body;

    if (!clientName || typeof clientName !== "string") {
      throw new Error("clientName is required");
    }
    if (!amount || Number(amount) <= 0) {
      throw new Error("amount must be a positive number");
    }

    const session = await createStripePaymentSession({
      organizationId,
      clientName,
      amount: Number(amount),
    });

    res.status(201).json({ success: true, url: session.url });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const createStripeSubscriptionSessionController = async (req: Request, res: Response) => {
  try {
    const organizationId = getOrganizationId(req);
    const { clientName, planName, amount, billingCycle } = req.body;

    if (!clientName || typeof clientName !== "string") {
      throw new Error("clientName is required");
    }
    if (!planName || typeof planName !== "string") {
      throw new Error("planName is required");
    }
    if (!amount || Number(amount) <= 0) {
      throw new Error("amount must be a positive number");
    }
    if (billingCycle !== "monthly" && billingCycle !== "yearly") {
      throw new Error("billingCycle must be monthly or yearly");
    }

    const session = await createStripeSubscriptionSession({
      organizationId,
      clientName,
      planName,
      amount: Number(amount),
      billingCycle,
    });

    res.status(201).json({ success: true, url: session.url });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const stripeWebhookHandler = async (req: Request, res: Response) => {
  try {
    const signature = req.headers["stripe-signature"] as string | undefined;
    const event = constructStripeEvent(req.body as Buffer, signature);
    await handleStripeEvent(event);
    res.status(200).json({ received: true });
  } catch (error: any) {
    console.error("Stripe webhook error:", error);
    res.status(400).json({ message: error.message || "Webhook error" });
  }
};
