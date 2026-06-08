import mongoose, { Schema, Document } from "mongoose";

export interface ISubscription extends Document {
  organizationId: mongoose.Types.ObjectId;
  clientName: string;
  planName: string;
  amount: number;
  billingCycle: "monthly" | "yearly";
  status: "trial" | "active" | "paused" | "canceled";
  nextBillingDate: Date;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  stripeCheckoutSessionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema: Schema<ISubscription> = new Schema(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    clientName: {
      type: String,
      required: true,
      trim: true,
    },
    planName: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    billingCycle: {
      type: String,
      enum: ["monthly", "yearly"],
      default: "monthly",
    },
    status: {
      type: String,
      enum: ["trial", "active", "paused", "canceled"],
      default: "active",
    },
    nextBillingDate: {
      type: Date,
      required: true,
    },
    stripeSubscriptionId: {
      type: String,
      trim: true,
      index: true,
    },
    stripeCustomerId: {
      type: String,
      trim: true,
    },
    stripeCheckoutSessionId: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
);

SubscriptionSchema.index({ organizationId: 1, status: 1, nextBillingDate: 1 });

export const SubscriptionModel = mongoose.model<ISubscription>("Subscription", SubscriptionSchema);
