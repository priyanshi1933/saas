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
  stripePaymentIntentId?: string;
  stripeCheckoutSessionId?: string;
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

export const upsertStripePayment = async (input: PaymentInput) => {
  if (!input.stripePaymentIntentId) {
    return await PaymentModel.create(input);
  }

  return await PaymentModel.findOneAndUpdate(
    { stripePaymentIntentId: input.stripePaymentIntentId },
    { $set: input },
    { new: true, upsert: true },
  );
};
