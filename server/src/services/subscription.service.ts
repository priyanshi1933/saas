import { SubscriptionModel } from "../models/subscription.model";
import { createInvoiceForOrganization } from "./invoice.service";

export type SubscriptionInput = {
  organizationId: string;
  clientName: string;
  planName: string;
  amount: number;
  billingCycle: "monthly" | "yearly";
  status?: "trial" | "active" | "paused" | "canceled";
  nextBillingDate?: Date;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  stripeCheckoutSessionId?: string;
};

export const getSubscriptionsByOrganization = async (organizationId: string) => {
  return await SubscriptionModel.find({ organizationId }).sort({ createdAt: -1 });
};

export const createSubscriptionForOrganization = async (input: SubscriptionInput) => {
  const now = new Date();
  const nextBillingDate = input.nextBillingDate ? new Date(input.nextBillingDate) : new Date(now);

  if (!input.nextBillingDate) {
    if (input.billingCycle === "yearly") {
      nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
    } else {
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
    }
  }

  const subscription = await SubscriptionModel.create({
    ...input,
    status: input.status || "active",
    nextBillingDate,
  });

  const invoiceNumber = `SUB-${subscription._id.toString().slice(-8).toUpperCase()}-${Date.now().toString().slice(-6)}`;
  const invoice = await createInvoiceForOrganization({
    organizationId: input.organizationId,
    clientName: input.clientName,
    invoiceNumber,
    status: "pending",
    dueDate: nextBillingDate,
    lineItems: [
      {
        description: `${input.planName} ${input.billingCycle} subscription`,
        quantity: 1,
        unitPrice: input.amount,
        total: input.amount,
      },
    ],
    subtotal: input.amount,
    taxRate: 0,
    discountAmount: 0,
    amount: input.amount,
  });

  return { subscription, invoice };
};

export const upsertStripeSubscription = async (input: SubscriptionInput) => {
  if (!input.stripeSubscriptionId) {
    return await SubscriptionModel.create(input);
  }

  return await SubscriptionModel.findOneAndUpdate(
    { stripeSubscriptionId: input.stripeSubscriptionId },
    {
      $set: {
        organizationId: input.organizationId,
        clientName: input.clientName,
        planName: input.planName,
        amount: input.amount,
        billingCycle: input.billingCycle,
        status: input.status || "active",
        nextBillingDate: input.nextBillingDate || new Date(),
        stripeSubscriptionId: input.stripeSubscriptionId,
        stripeCustomerId: input.stripeCustomerId,
        stripeCheckoutSessionId: input.stripeCheckoutSessionId,
      },
    },
    { new: true, upsert: true },
  );
};
