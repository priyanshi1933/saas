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

  const outstanding = invoices
    .filter((invoice) => ["pending", "overdue"].includes(invoice.status))
    .reduce((sum, invoice) => sum + invoice.amount, 0);
  const paid = payments
    .filter((payment) => payment.status === "succeeded")
    .reduce((sum, payment) => sum + payment.amount, 0);
  const recurringRevenue = subscriptions
    .filter((subscription) => subscription.status === "active")
    .reduce((sum, subscription) => sum + subscription.amount, 0);

  return {
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
  };
};
