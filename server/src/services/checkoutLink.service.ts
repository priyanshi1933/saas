import crypto from "crypto";
import { CheckoutLinkModel } from "../models/checkoutLink.model";
import { InvoiceModel } from "../models/invoice.model";
import { SubscriptionModel } from "../models/subscription.model";
import { createPaymentForOrganization } from "./payment.service";

const newToken = () => crypto.randomBytes(24).toString("hex");

const clientUrl = () => process.env.CLIENT_URL || "http://localhost:5173";

export const createInvoiceCheckoutLink = async (organizationId: string, invoiceId: string) => {
  const invoice = await InvoiceModel.findOne({ _id: invoiceId, organizationId });
  if (!invoice) {
    throw new Error("Invoice not found");
  }
  if (invoice.status === "paid") {
    throw new Error("Invoice is already paid");
  }

  const checkoutLink = await CheckoutLinkModel.create({
    organizationId,
    resourceType: "invoice",
    resourceId: invoice._id,
    token: newToken(),
    clientName: invoice.clientName,
    title: `Invoice ${invoice.invoiceNumber}`,
    amount: invoice.amount,
    status: "active",
  });

  return {
    checkoutLink,
    url: `${clientUrl()}/checkout/${checkoutLink.token}`,
  };
};

export const createSubscriptionCheckoutLink = async (organizationId: string, subscriptionId: string) => {
  const subscription = await SubscriptionModel.findOne({ _id: subscriptionId, organizationId });
  if (!subscription) {
    throw new Error("Subscription plan not found");
  }

  const checkoutLink = await CheckoutLinkModel.create({
    organizationId,
    resourceType: "subscription",
    resourceId: subscription._id,
    token: newToken(),
    clientName: subscription.clientName,
    title: `${subscription.planName} (${subscription.billingCycle})`,
    amount: subscription.amount,
    status: "active",
  });

  return {
    checkoutLink,
    url: `${clientUrl()}/checkout/${checkoutLink.token}`,
  };
};

export const getCheckoutLinkByToken = async (token: string) => {
  const checkoutLink = await CheckoutLinkModel.findOne({ token });
  if (!checkoutLink) {
    throw new Error("Checkout link not found");
  }
  if (checkoutLink.status !== "active") {
    throw new Error("Checkout link is no longer active");
  }
  if (checkoutLink.expiresAt && checkoutLink.expiresAt < new Date()) {
    checkoutLink.status = "expired";
    await checkoutLink.save();
    throw new Error("Checkout link expired");
  }

  return checkoutLink;
};

export const completeCheckoutLink = async (token: string) => {
  const checkoutLink = await getCheckoutLinkByToken(token);

  await createPaymentForOrganization({
    organizationId: checkoutLink.organizationId.toString(),
    clientName: checkoutLink.clientName,
    amount: checkoutLink.amount,
    provider: "Stripe (fake client checkout)",
    status: "succeeded",
    paidAt: new Date(),
  });

  if (checkoutLink.resourceType === "invoice") {
    await InvoiceModel.findOneAndUpdate(
      { _id: checkoutLink.resourceId, organizationId: checkoutLink.organizationId },
      { status: "paid" },
      { new: true },
    );
  }

  if (checkoutLink.resourceType === "subscription") {
    await SubscriptionModel.findOneAndUpdate(
      { _id: checkoutLink.resourceId, organizationId: checkoutLink.organizationId },
      { status: "active" },
      { new: true },
    );
  }

  checkoutLink.status = "completed";
  checkoutLink.completedAt = new Date();
  await checkoutLink.save();

  return checkoutLink;
};
