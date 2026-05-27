import { Request, Response } from "express";
import { ClientModel } from "../models/client.model";
import { InvoiceModel } from "../models/invoice.model";
import { PaymentModel } from "../models/payment.model";
import { SubscriptionModel } from "../models/subscription.model";

const getOrganizationId = (req: Request) => {
  const organizationId = (req as any).user?.organizationId;
  if (!organizationId) {
    throw new Error("Organization context is required");
  }
  return organizationId;
};

const toMoney = (value: unknown) => {
  const amount = Number(value);
  if (Number.isNaN(amount) || amount < 0) {
    throw new Error("Amount must be a valid positive number");
  }
  return amount;
};

export const getWorkspaceSummary = async (req: Request, res: Response) => {
  try {
    const organizationId = getOrganizationId(req);
    const [clients, invoices, payments, subscriptions] = await Promise.all([
      ClientModel.find({ organizationId }).sort({ createdAt: -1 }),
      InvoiceModel.find({ organizationId }).sort({ createdAt: -1 }),
      PaymentModel.find({ organizationId }).sort({ paidAt: -1 }),
      SubscriptionModel.find({ organizationId }).sort({ createdAt: -1 }),
    ]);

    const outstanding = invoices
      .filter((invoice) => ["pending", "overdue"].includes(invoice.status))
      .reduce((sum, invoice) => sum + invoice.amount, 0);
    const paid = payments
      .filter((payment) => payment.status === "succeeded")
      .reduce((sum, payment) => sum + payment.amount, 0);
    const recurringRevenue = subscriptions
      .filter((subscription) => subscription.status === "active")
      .reduce((sum, subscription) => sum + subscription.amount, 0);

    res.json({
      success: true,
      data: {
        metrics: {
          outstanding,
          paid,
          recurringRevenue,
          clients: clients.length,
          pendingInvoices: invoices.filter((invoice) => invoice.status === "pending").length,
          activeSubscriptions: subscriptions.filter((subscription) => subscription.status === "active").length,
        },
        clients,
        invoices,
        payments,
        subscriptions,
      },
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getClients = async (req: Request, res: Response) => {
  try {
    const organizationId = getOrganizationId(req);
    const clients = await ClientModel.find({ organizationId }).sort({ createdAt: -1 });
    res.json({ success: true, data: clients });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const createClient = async (req: Request, res: Response) => {
  try {
    const organizationId = getOrganizationId(req);
    const {
      name,
      taxId,
      billingAddress,
      currency = "USD",
    } = req.body;
    const client = await ClientModel.create({
      organizationId,
      name,
      taxId,
      billingAddress,
      currency,
    });
    res.status(201).json({ success: true, data: client });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getInvoices = async (req: Request, res: Response) => {
  try {
    const organizationId = getOrganizationId(req);
    const invoices = await InvoiceModel.find({ organizationId }).sort({ createdAt: -1 });
    res.json({ success: true, data: invoices });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const createInvoice = async (req: Request, res: Response) => {
  try {
    const organizationId = getOrganizationId(req);
    const { clientName, invoiceNumber, amount, status = "draft", dueDate } = req.body;
    const invoice = await InvoiceModel.create({
      organizationId,
      clientName,
      invoiceNumber,
      amount: toMoney(amount),
      status,
      dueDate,
    });
    res.status(201).json({ success: true, data: invoice });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getPayments = async (req: Request, res: Response) => {
  try {
    const organizationId = getOrganizationId(req);
    const payments = await PaymentModel.find({ organizationId }).sort({ paidAt: -1 });
    res.json({ success: true, data: payments });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const createPayment = async (req: Request, res: Response) => {
  try {
    const organizationId = getOrganizationId(req);
    const { clientName, amount, provider = "Online", status = "pending", paidAt } = req.body;
    const payment = await PaymentModel.create({
      organizationId,
      clientName,
      amount: toMoney(amount),
      provider,
      status,
      paidAt: paidAt || new Date(),
    });
    res.status(201).json({ success: true, data: payment });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getSubscriptions = async (req: Request, res: Response) => {
  try {
    const organizationId = getOrganizationId(req);
    const subscriptions = await SubscriptionModel.find({ organizationId }).sort({ createdAt: -1 });
    res.json({ success: true, data: subscriptions });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const createSubscription = async (req: Request, res: Response) => {
  try {
    const organizationId = getOrganizationId(req);
    const { clientName, planName, amount, interval = "monthly", status = "active" } = req.body;
    const subscription = await SubscriptionModel.create({
      organizationId,
      clientName,
      planName,
      amount: toMoney(amount),
      interval,
      status,
    });
    res.status(201).json({ success: true, data: subscription });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
