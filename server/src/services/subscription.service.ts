import { SubscriptionModel } from "../models/subscription.model";

export type SubscriptionInput = {
  organizationId: string;
  clientName: string;
  planName: string;
  amount: number;
  interval: "monthly" | "yearly";
  status: "trial" | "active" | "paused" | "canceled";
};

export const getSubscriptionsByOrganization = async (organizationId: string) => {
  return await SubscriptionModel.find({ organizationId }).sort({ createdAt: -1 });
};

export const createSubscriptionForOrganization = async (input: SubscriptionInput) => {
  return await SubscriptionModel.create(input);
};
