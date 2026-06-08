import { Request, Response } from "express";
import {
  createSubscriptionForOrganization,
  getSubscriptionsByOrganization,
} from "../services/subscription.service";
import { subscriptionSchema, validateBody } from "../validation";
import { getOrganizationId } from "./helpers";

export const getSubscriptions = async (req: Request, res: Response) => {
  try {
    const organizationId = getOrganizationId(req);
    const subscriptions = await getSubscriptionsByOrganization(organizationId);
    res.json({ success: true, data: subscriptions });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const createSubscription = async (req: Request, res: Response) => {
  try {
    const organizationId = getOrganizationId(req);
    const input = validateBody<{
      clientName: string;
      planName: string;
      amount: number;
      billingCycle: "monthly" | "yearly";
    }>(subscriptionSchema, req.body);

    const subscriptionResult = await createSubscriptionForOrganization({ organizationId, ...input });
    res.status(201).json({ success: true, data: subscriptionResult });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
