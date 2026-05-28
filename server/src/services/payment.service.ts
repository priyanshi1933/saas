import { PaymentModel } from "../models/payment.model";

export type PaymentInput = {
  organizationId: string;
  clientName: string;
  amount: number;
  provider: string;
  status: "succeeded" | "pending" | "failed";
  paidAt: Date;
};

export const getPaymentsByOrganization = async (organizationId: string) => {
  return await PaymentModel.find({ organizationId }).sort({ paidAt: -1 });
};

export const createPaymentForOrganization = async (input: PaymentInput) => {
  return await PaymentModel.create(input);
};
