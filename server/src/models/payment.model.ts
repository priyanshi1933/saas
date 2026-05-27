import mongoose, { Schema, Document } from "mongoose";

export interface IPayment extends Document {
  organizationId: mongoose.Types.ObjectId;
  clientName: string;
  amount: number;
  provider: string;
  status: "succeeded" | "pending" | "failed";
  paidAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema: Schema<IPayment> = new Schema(
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
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    provider: {
      type: String,
      required: true,
      trim: true,
      default: "Online",
    },
    status: {
      type: String,
      enum: ["succeeded", "pending", "failed"],
      default: "pending",
    },
    paidAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true },
);

export const PaymentModel = mongoose.model<IPayment>("Payment", PaymentSchema);
