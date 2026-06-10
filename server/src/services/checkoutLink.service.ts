import crypto from "crypto";
import { CheckoutLinkModel } from "../models/checkoutLink.model";
import { InvoiceModel } from "../models/invoice.model";
import { SubscriptionModel } from "../models/subscription.model";
<<<<<<< HEAD
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
=======
import { upsertRazorpayPayment } from "./payment.service";
import {
  createRazorpayOrder,
  getRazorpayKeyId,
  verifyRazorpayOrderSignature,
  type RazorpayCheckoutPayload,
} from "./razorpay.service";
import { activateSubscription } from "./subscription.service";

const newToken = () => crypto.randomBytes(24).toString("hex");
const clientUrl = () => process.env.CLIENT_URL || "http://localhost:5173";
const currency = () => (process.env.RAZORPAY_CURRENCY || "INR").toUpperCase();

export const createInvoiceCheckoutLink = async (organizationId: string, invoiceId: string) => {
  const invoice = await InvoiceModel.findOne({ _id: invoiceId, organizationId });
  if (!invoice) throw new Error("Invoice not found");
  if (invoice.status === "paid") throw new Error("Invoice is already paid");
>>>>>>> c3eebe6 (first commit)

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
<<<<<<< HEAD
  if (!subscription) {
    throw new Error("Subscription plan not found");
  }
=======
  if (!subscription) throw new Error("Subscription not found");

  // ✅ Find the current pending invoice for this subscription
  const invoice = await InvoiceModel.findById(subscription.currentInvoiceId);
  if (!invoice) throw new Error("Subscription invoice not found");
  if (invoice.status === "paid") throw new Error("Subscription is already paid for this cycle");
>>>>>>> c3eebe6 (first commit)

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
<<<<<<< HEAD
  if (!checkoutLink) {
    throw new Error("Checkout link not found");
  }
  if (checkoutLink.status !== "active") {
    throw new Error("Checkout link is no longer active");
  }
=======
  if (!checkoutLink) throw new Error("Checkout link not found");
  if (checkoutLink.status !== "active") throw new Error("Checkout link is no longer active");
>>>>>>> c3eebe6 (first commit)
  if (checkoutLink.expiresAt && checkoutLink.expiresAt < new Date()) {
    checkoutLink.status = "expired";
    await checkoutLink.save();
    throw new Error("Checkout link expired");
  }
<<<<<<< HEAD

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

=======
  return checkoutLink;
};

export const createRazorpayCheckoutForToken = async (token: string): Promise<RazorpayCheckoutPayload> => {
  const checkoutLink = await getCheckoutLinkByToken(token);
  const notes = {
    organizationId: checkoutLink.organizationId.toString(),
    checkoutToken: checkoutLink.token,
    resourceType: checkoutLink.resourceType,
    resourceId: checkoutLink.resourceId.toString(),
  };

  // ✅ Both invoice and subscription use regular Razorpay order
  const order = await createRazorpayOrder({
    amount: checkoutLink.amount,
    currency: currency(),
    receipt: `${checkoutLink.resourceType}_${checkoutLink._id.toString().slice(-16)}`,
    notes,
  });

  checkoutLink.razorpayOrderId = order.id;
  await checkoutLink.save();

  return {
    key: getRazorpayKeyId(),
    name: "Agency Billing",
    description: checkoutLink.title,
    amount: order.amount,
    currency: order.currency,
    order_id: order.id,
    notes,
  };
};

export const completeCheckoutLink = async (
  token: string,
  payload: {
    razorpay_payment_id?: string;
    razorpay_order_id?: string;
    razorpay_signature?: string;
  },
) => {
  const checkoutLink = await getCheckoutLinkByToken(token);

  const paymentId = payload.razorpay_payment_id;
  const signature = payload.razorpay_signature;
  if (!paymentId || !signature) {
    throw new Error("Razorpay payment verification details are required");
  }

  const razorpayOrderId = payload.razorpay_order_id || checkoutLink.razorpayOrderId;
  if (!razorpayOrderId || !verifyRazorpayOrderSignature({ orderId: razorpayOrderId, paymentId, signature })) {
    throw new Error("Razorpay payment signature verification failed");
  }

  let invoiceId: string | undefined;

  if (checkoutLink.resourceType === "invoice") {
    invoiceId = checkoutLink.resourceId.toString();
    await InvoiceModel.findByIdAndUpdate(invoiceId, { status: "paid" });
  }

  if (checkoutLink.resourceType === "subscription") {
    // ✅ Activate subscription and mark current invoice as paid
    const subscription = await activateSubscription({
      organizationId: checkoutLink.organizationId.toString(),
      subscriptionId: checkoutLink.resourceId.toString(),
    });
    invoiceId = subscription.currentInvoiceId?.toString();
    if (invoiceId) {
      await InvoiceModel.findByIdAndUpdate(invoiceId, { status: "paid" });
    }
  }

  await upsertRazorpayPayment({
    organizationId: checkoutLink.organizationId.toString(),
    invoiceId,
    clientName: checkoutLink.clientName,
    amount: checkoutLink.amount,
    provider: "Razorpay",
    status: "succeeded",
    paidAt: new Date(),
    razorpayPaymentId: paymentId,
    razorpayOrderId,
  });

>>>>>>> c3eebe6 (first commit)
  checkoutLink.status = "completed";
  checkoutLink.completedAt = new Date();
  await checkoutLink.save();

  return checkoutLink;
<<<<<<< HEAD
};
=======
};
>>>>>>> c3eebe6 (first commit)
