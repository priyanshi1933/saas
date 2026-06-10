import { PaymentModel } from "../models/payment.model";
import { updateInvoiceStatus } from "./invoice.service";

export type PaymentInput = {
  organizationId: string;
  invoiceId?: string;
  clientName: string;
  amount: number;
  provider: string;
  status: "succeeded" | "pending" | "failed";
  paidAt: Date;
<<<<<<< HEAD
  stripePaymentIntentId?: string;
  stripeCheckoutSessionId?: string;
=======
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  razorpaySubscriptionId?: string;
>>>>>>> c3eebe6 (first commit)
};

export const getPaymentsByOrganization = async (organizationId: string) => {
  return await PaymentModel.find({ organizationId }).sort({ paidAt: -1 });
};

export const createPaymentForOrganization = async (input: PaymentInput) => {
  const payment = await PaymentModel.create(input);

  if (input.invoiceId && input.status === "succeeded") {
    await updateInvoiceStatus(input.organizationId, input.invoiceId, "paid");
  }

  return payment;
};

<<<<<<< HEAD
export const upsertStripePayment = async (input: PaymentInput) => {
  if (!input.stripePaymentIntentId) {
=======
export const upsertRazorpayPayment = async (input: PaymentInput) => {
  if (!input.razorpayPaymentId) {
>>>>>>> c3eebe6 (first commit)
    return await PaymentModel.create(input);
  }

  return await PaymentModel.findOneAndUpdate(
<<<<<<< HEAD
    { stripePaymentIntentId: input.stripePaymentIntentId },
=======
    { razorpayPaymentId: input.razorpayPaymentId },
>>>>>>> c3eebe6 (first commit)
    { $set: input },
    { new: true, upsert: true },
  );
};
