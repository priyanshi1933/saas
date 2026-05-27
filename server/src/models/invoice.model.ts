import mongoose, { Schema, Document } from "mongoose";

export interface IInvoice extends Document {
  organizationId: mongoose.Types.ObjectId;
  clientName: string;
  invoiceNumber: string;
  amount: number;
  status: "draft" | "pending" | "paid" | "overdue";
  dueDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceSchema: Schema<IInvoice> = new Schema(
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
    invoiceNumber: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["draft", "pending", "paid", "overdue"],
      default: "draft",
    },
    dueDate: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true },
);

InvoiceSchema.index({ organizationId: 1, invoiceNumber: 1 }, { unique: true });

export const InvoiceModel = mongoose.model<IInvoice>("Invoice", InvoiceSchema);
