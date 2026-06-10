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
<<<<<<< HEAD
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  stripeCheckoutSessionId?: string;
=======
  currentInvoiceId?: string;
>>>>>>> c3eebe6 (first commit)
};

export const getSubscriptionsByOrganization = async (organizationId: string) => {
  return await SubscriptionModel.find({ organizationId }).sort({ createdAt: -1 });
};

export const createSubscriptionForOrganization = async (input: SubscriptionInput) => {
  const now = new Date();
<<<<<<< HEAD
  const nextBillingDate = input.nextBillingDate ? new Date(input.nextBillingDate) : new Date(now);

  if (!input.nextBillingDate) {
    if (input.billingCycle === "yearly") {
      nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
    } else {
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
    }
=======
  const nextBillingDate = new Date(now);

  if (input.billingCycle === "yearly") {
    nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
  } else {
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
>>>>>>> c3eebe6 (first commit)
  }

  const subscription = await SubscriptionModel.create({
    ...input,
<<<<<<< HEAD
    status: input.status || "active",
    nextBillingDate,
  });

=======
    status: "trial",
    nextBillingDate,
  });

  // ✅ Create initial pending invoice
>>>>>>> c3eebe6 (first commit)
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

<<<<<<< HEAD
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
=======
  subscription.currentInvoiceId = invoice._id as any;
  await subscription.save();

  return { subscription, invoice };
};

export const activateSubscription = async ({
  organizationId,
  subscriptionId,
}: {
  organizationId: string;
  subscriptionId: string;
}) => {
  const subscription = await SubscriptionModel.findOne({ _id: subscriptionId, organizationId });
  if (!subscription) throw new Error("Subscription not found");

  const nextBillingDate = new Date();
  if (subscription.billingCycle === "yearly") {
    nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
  } else {
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
  }

  subscription.status = "active";
  subscription.nextBillingDate = nextBillingDate;
  await subscription.save();

  return subscription;
};

export const cancelSubscription = async (organizationId: string, subscriptionId: string) => {
  return await SubscriptionModel.findOneAndUpdate(
    { _id: subscriptionId, organizationId, status: { $ne: "canceled" } },
    { status: "canceled" },
    { new: true },
  );
};

// ✅ Auto-invoice generation for billing cycle renewals
export const generateRenewalInvoices = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Find active subscriptions due today
  const subscriptions = await SubscriptionModel.find({
    status: "active",
    nextBillingDate: { $gte: today, $lt: tomorrow },
  });

  console.log(`Generating renewal invoices for ${subscriptions.length} subscriptions`);

  for (const subscription of subscriptions) {
    const nextBillingDate = new Date();
    if (subscription.billingCycle === "yearly") {
      nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
    } else {
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
    }

    const invoiceNumber = `SUB-${subscription._id.toString().slice(-8).toUpperCase()}-${Date.now().toString().slice(-6)}`;
    const invoice = await createInvoiceForOrganization({
      organizationId: subscription.organizationId.toString(),
      clientName: subscription.clientName,
      invoiceNumber,
      status: "pending",
      dueDate: nextBillingDate,
      lineItems: [
        {
          description: `${subscription.planName} ${subscription.billingCycle} subscription renewal`,
          quantity: 1,
          unitPrice: subscription.amount,
          total: subscription.amount,
        },
      ],
      subtotal: subscription.amount,
      taxRate: 0,
      discountAmount: 0,
      amount: subscription.amount,
    });

    subscription.currentInvoiceId = invoice._id as any;
    subscription.nextBillingDate = nextBillingDate;
    await subscription.save();

    console.log(`Renewal invoice created for ${subscription.clientName}: ${invoiceNumber}`);
  }
};
>>>>>>> c3eebe6 (first commit)
