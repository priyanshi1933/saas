import Joi from "joi";
import { amount, requiredText } from "./common";

const subscriptionIntervalValues = ["monthly", "yearly"] as const;
const subscriptionStatusValues = ["trial", "active", "paused", "canceled"] as const;

export const subscriptionSchema = Joi.object({
  clientName: requiredText("Client name", 2, 80),
  planName: requiredText("Plan name", 2, 80),
  amount,
  interval: Joi.string()
    .valid(...subscriptionIntervalValues)
    .default("monthly")
    .messages({ "any.only": "Please select a valid billing interval" }),
  status: Joi.string()
    .valid(...subscriptionStatusValues)
    .default("active")
    .messages({ "any.only": "Please select a valid subscription status" }),
});
