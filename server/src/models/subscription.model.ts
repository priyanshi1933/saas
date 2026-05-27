import mongoose, { Schema, Document } from "mongoose";

export interface ISubscription extends Document {
  organizationId: mongoose.Types.ObjectId;
  clientName: string;
  planName: string;
  amount: number;
  interval: "monthly" | "yearly";
  status: "trial" | "active" | "paused" | "canceled";
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
    interval: {
      type: String,
      enum: ["monthly", "yearly"],
      default: "monthly",
    },
    status: {
      type: String,
      enum: ["trial", "active", "paused", "canceled"],
      default: "active",
    },
  },
  { timestamps: true },
);

export const SubscriptionModel = mongoose.model<ISubscription>("Subscription", SubscriptionSchema);
