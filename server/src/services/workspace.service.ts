import { getClientsByOrganization } from "./client.service";
import { getInvoicesByOrganization } from "./invoice.service";
import { getPaymentsByOrganization } from "./payment.service";
import { getSubscriptionsByOrganization } from "./subscription.service";

export const getWorkspaceSummaryForOrganization = async (organizationId: string) => {
  const [clients, invoices, payments, subscriptions] = await Promise.all([
    getClientsByOrganization(organizationId),
    getInvoicesByOrganization(organizationId),
    getPaymentsByOrganization(organizationId),
    getSubscriptionsByOrganization(organizationId),
  ]);

  const activeSubscriptions = subscriptions.filter((subscription) => subscription.status === "active");
  const outstandingInvoices = invoices.filter((invoice) => ["pending", "overdue"].includes(invoice.status));
  const outstanding = invoices
    .filter((invoice) => ["pending", "overdue"].includes(invoice.status))
    .reduce((sum, invoice) => sum + invoice.amount, 0);
  const paid = payments
    .filter((payment) => payment.status === "succeeded")
    .reduce((sum, payment) => sum + payment.amount, 0);
  const mrr = activeSubscriptions.reduce((sum, subscription) => {
    const billingCycle = (subscription as any).billingCycle || (subscription as any).interval || "monthly";
    return sum + (billingCycle === "yearly" ? subscription.amount / 12 : subscription.amount);
  }, 0);

  const topClientMap = new Map<
    string,
    { clientName: string; paid: number; outstanding: number; subscriptionMrr: number; totalValue: number }
  >();

  const ensureClient = (clientName: string) => {
    const key = clientName.trim().toLowerCase();
    const existing = topClientMap.get(key);

    if (existing) {
      return existing;
    }

    const client = { clientName, paid: 0, outstanding: 0, subscriptionMrr: 0, totalValue: 0 };
    topClientMap.set(key, client);
    return client;
  };

  payments
    .filter((payment) => payment.status === "succeeded")
    .forEach((payment) => {
      const client = ensureClient(payment.clientName);
      client.paid += payment.amount;
    });

  outstandingInvoices.forEach((invoice) => {
    const client = ensureClient(invoice.clientName);
    client.outstanding += invoice.amount;
  });

  activeSubscriptions.forEach((subscription) => {
    const billingCycle = (subscription as any).billingCycle || (subscription as any).interval || "monthly";
    const client = ensureClient(subscription.clientName);
    client.subscriptionMrr += billingCycle === "yearly" ? subscription.amount / 12 : subscription.amount;
  });

  const topClients = Array.from(topClientMap.values())
    .map((client) => ({
      ...client,
      paid: Math.round(client.paid * 100) / 100,
      outstanding: Math.round(client.outstanding * 100) / 100,
      subscriptionMrr: Math.round(client.subscriptionMrr * 100) / 100,
      totalValue: Math.round((client.paid + client.outstanding + client.subscriptionMrr) * 100) / 100,
    }))
    .sort((first, second) => second.totalValue - first.totalValue)
    .slice(0, 5);

  return {
    metrics: {
      outstanding,
      paid,
      mrr: Math.round(mrr * 100) / 100,
      recurringRevenue: Math.round(mrr * 100) / 100,
      clients: clients.length,
      pendingInvoices: invoices.filter((invoice) => invoice.status === "pending").length,
      activeSubscriptions: activeSubscriptions.length,
    },
    clients,
    invoices,
    outstandingInvoices,
    payments,
    subscriptions,
    topClients,
  };
};
