import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  createClient,
  createInvoice,
  createPayment,
  createSubscription,
  getWorkspaceSummary,
} from "../Api/auth";
import TeamPage from "./TeamPage";

type View = "dashboard" | "clients" | "invoices" | "payments" | "subscriptions" | "team";

type Client = {
  _id: string;
  name: string;
  taxId?: string;
  billingAddress?: string;
  currency: string;
};

type Invoice = {
  _id: string;
  clientName: string;
  invoiceNumber: string;
  amount: number;
  status: string;
  dueDate: string;
};

type Payment = {
  _id: string;
  clientName: string;
  amount: number;
  provider: string;
  status: string;
  paidAt: string;
};

type Subscription = {
  _id: string;
  clientName: string;
  planName: string;
  amount: number;
  interval: string;
  status: string;
};

type Summary = {
  metrics: {
    outstanding: number;
    paid: number;
    recurringRevenue: number;
    clients: number;
    pendingInvoices: number;
    activeSubscriptions: number;
  };
  clients: Client[];
  invoices: Invoice[];
  payments: Payment[];
  subscriptions: Subscription[];
};

type DashboardProps = {
  view: View;
};

const emptySummary: Summary = {
  metrics: {
    outstanding: 0,
    paid: 0,
    recurringRevenue: 0,
    clients: 0,
    pendingInvoices: 0,
    activeSubscriptions: 0,
  },
  clients: [],
  invoices: [],
  payments: [],
  subscriptions: [],
};

const money = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value || 0);
};

const dateLabel = (value: string) => {
  return value ? new Date(value).toLocaleDateString() : "";
};

const Dashboard = ({ view }: DashboardProps) => {
  const navigate = useNavigate();
  const workspaceName = localStorage.getItem("workspaceName") || "Agency Workspace";
  const role = localStorage.getItem("role") || "member";
  const organizationId = localStorage.getItem("organizationId") || "";
  const [summary, setSummary] = useState<Summary>(emptySummary);
  const [message, setMessage] = useState("");
  const [inviteRefreshKey, setInviteRefreshKey] = useState(0);
  const [clientForm, setClientForm] = useState({
    name: "",
    taxId: "",
    billingAddress: "",
    currency: "USD",
  });
  const [invoiceForm, setInvoiceForm] = useState({
    clientName: "",
    invoiceNumber: "",
    amount: "",
    status: "draft",
    dueDate: "",
  });
  const [paymentForm, setPaymentForm] = useState({
    clientName: "",
    amount: "",
    provider: "Online",
    status: "succeeded",
    paidAt: new Date().toISOString().slice(0, 10),
  });
  const [subscriptionForm, setSubscriptionForm] = useState({
    clientName: "",
    planName: "",
    amount: "",
    interval: "monthly",
    status: "active",
  });

  const canInvite = useMemo(() => ["owner", "admin"].includes(role), [role]);

  const loadSummary = async () => {
    try {
      const response = await getWorkspaceSummary();
      setSummary(response.data.data || emptySummary);
      setMessage("");
    } catch (error: any) {
      setMessage(error.response?.data?.message || "Could not load workspace data");
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const handleFormChange =
    <T extends Record<string, string>>(setter: React.Dispatch<React.SetStateAction<T>>) =>
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setter((prev) => ({ ...prev, [name]: value }));
    };

  const submitAndRefresh = async (e: FormEvent, action: () => Promise<unknown>, successMessage: string) => {
    e.preventDefault();
    try {
      await action();
      await loadSummary();
      setMessage(successMessage);
    } catch (error: any) {
      setMessage(error.response?.data?.message || "Could not save data");
    }
  };

  const pageTitle: Record<View, string> = {
    dashboard: "Dashboard",
    clients: "Clients",
    invoices: "Invoices",
    payments: "Payments",
    subscriptions: "Subscriptions",
    team: "Team",
  };

  const renderEmpty = (label: string) => <p className="muted empty-state">No {label} added yet.</p>;

  const renderShell = (children: ReactNode) => (
    <main className="dashboard-shell">
      <aside className="sidebar">
        <div>
          <div className="brand-mark">S</div>
          <h1>SaaS Billing</h1>
          <p>{workspaceName}</p>
        </div>
        <nav className="side-nav">
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/clients">Clients</NavLink>
          <NavLink to="/invoices">Invoices</NavLink>
          <NavLink to="/payments">Payments</NavLink>
          <NavLink to="/subscriptions">Subscriptions</NavLink>
          <NavLink to="/team">Team</NavLink>
        </nav>
        <button className="btn btn-outline-light w-100" onClick={logout}>
          Sign out
        </button>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Multi-tenant workspace</p>
            <h2>{pageTitle[view]}</h2>
          </div>
          <div className="user-chip">
            <span>{role.replace("_", " ")}</span>
            <small>{organizationId ? organizationId.slice(-8) : "workspace"}</small>
          </div>
        </header>
        {message && <div className="alert alert-info py-2">{message}</div>}
        {children}
      </section>
    </main>
  );

  const metrics = (
    <section className="metric-grid">
      <div className="metric-card">
        <span>Outstanding</span>
        <strong>{money(summary.metrics.outstanding)}</strong>
        <small>{summary.metrics.pendingInvoices} invoices need payment</small>
      </div>
      <div className="metric-card">
        <span>Paid</span>
        <strong>{money(summary.metrics.paid)}</strong>
        <small>Successful online payments</small>
      </div>
      <div className="metric-card">
        <span>Recurring revenue</span>
        <strong>{money(summary.metrics.recurringRevenue)}</strong>
        <small>{summary.metrics.activeSubscriptions} active subscriptions</small>
      </div>
      <div className="metric-card">
        <span>Clients</span>
        <strong>{summary.metrics.clients}</strong>
        <small>Isolated to this workspace</small>
      </div>
    </section>
  );

  const invoiceTable = (
    <section className="panel wide-panel">
      <div className="section-header">
        <div>
          <p className="eyebrow">Billing</p>
          <h2>Invoices</h2>
        </div>
        <NavLink className="btn btn-primary" to="/invoices">
          Manage
        </NavLink>
      </div>
      {summary.invoices.length === 0 ? (
        renderEmpty("invoices")
      ) : (
        <div className="table-wrap">
          <table className="table align-middle">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Client</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Due</th>
              </tr>
            </thead>
            <tbody>
              {summary.invoices.map((invoice) => (
                <tr key={invoice._id}>
                  <td>{invoice.invoiceNumber}</td>
                  <td>{invoice.clientName}</td>
                  <td>{money(invoice.amount)}</td>
                  <td>
                    <span className={`status-pill ${invoice.status}`}>{invoice.status}</span>
                  </td>
                  <td>{dateLabel(invoice.dueDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );

  if (view === "clients") {
    return renderShell(
      <section className="content-grid">
        <section className="panel">
          <div className="section-header">
            <div>
              <p className="eyebrow">Workspace CRM</p>
              <h2>Add client</h2>
            </div>
          </div>
          <form
            className="stack"
            onSubmit={(e) =>
              submitAndRefresh(e, () => createClient(clientForm), "Client added.")
            }
          >
            <input className="form-control" name="name" placeholder="Client name" value={clientForm.name} onChange={handleFormChange(setClientForm)} />
            <input className="form-control" name="taxId" placeholder="Tax ID / GST / VAT" value={clientForm.taxId} onChange={handleFormChange(setClientForm)} />
            <select className="form-select" name="currency" value={clientForm.currency} onChange={handleFormChange(setClientForm)}>
              <option value="USD">USD - US Dollar</option>
              <option value="INR">INR - Indian Rupee</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
              <option value="AUD">AUD - Australian Dollar</option>
              <option value="CAD">CAD - Canadian Dollar</option>
            </select>
            <textarea
              className="form-control"
              name="billingAddress"
              placeholder="Billing address"
              value={clientForm.billingAddress}
              onChange={handleFormChange(setClientForm)}
              rows={4}
            />
            <button className="btn btn-primary">Save client</button>
          </form>
        </section>
        <section className="panel wide-panel">
          <h2>Clients</h2>
          {summary.clients.length === 0 ? renderEmpty("clients") : (
            <div className="subscription-list">
              {summary.clients.map((client) => (
                <div className="subscription-row" key={client._id}>
                  <div>
                    <strong>{client.name}</strong>
                    <span>{client.billingAddress || "No billing address"}</span>
                  </div>
                  <div>
                    <strong>{client.currency || "USD"}</strong>
                    <span>{client.taxId || "No tax ID"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </section>,
    );
  }

  if (view === "invoices") {
    return renderShell(
      <section className="content-grid">
        <section className="panel">
          <p className="eyebrow">Billing</p>
          <h2>New invoice</h2>
          <form
            className="stack form-section"
            onSubmit={(e) =>
              submitAndRefresh(e, () => createInvoice(invoiceForm), "Invoice added.")
            }
          >
            <input className="form-control" name="clientName" placeholder="Client name" value={invoiceForm.clientName} onChange={handleFormChange(setInvoiceForm)} />
            <input className="form-control" name="invoiceNumber" placeholder="Invoice number" value={invoiceForm.invoiceNumber} onChange={handleFormChange(setInvoiceForm)} />
            <input className="form-control" name="amount" type="number" placeholder="Amount" value={invoiceForm.amount} onChange={handleFormChange(setInvoiceForm)} />
            <input className="form-control" name="dueDate" type="date" value={invoiceForm.dueDate} onChange={handleFormChange(setInvoiceForm)} />
            <select className="form-select" name="status" value={invoiceForm.status} onChange={handleFormChange(setInvoiceForm)}>
              <option value="draft">Draft</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
            <button className="btn btn-primary">Save invoice</button>
          </form>
        </section>
        {invoiceTable}
      </section>,
    );
  }

  if (view === "payments") {
    return renderShell(
      <section className="content-grid">
        <section className="panel">
          <p className="eyebrow">Online payments</p>
          <h2>Add payment</h2>
          <form
            className="stack form-section"
            onSubmit={(e) =>
              submitAndRefresh(e, () => createPayment(paymentForm), "Payment added.")
            }
          >
            <input className="form-control" name="clientName" placeholder="Client name" value={paymentForm.clientName} onChange={handleFormChange(setPaymentForm)} />
            <input className="form-control" name="amount" type="number" placeholder="Amount" value={paymentForm.amount} onChange={handleFormChange(setPaymentForm)} />
            <input className="form-control" name="provider" placeholder="Provider" value={paymentForm.provider} onChange={handleFormChange(setPaymentForm)} />
            <input className="form-control" name="paidAt" type="date" value={paymentForm.paidAt} onChange={handleFormChange(setPaymentForm)} />
            <select className="form-select" name="status" value={paymentForm.status} onChange={handleFormChange(setPaymentForm)}>
              <option value="succeeded">Succeeded</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
            <button className="btn btn-primary">Save payment</button>
          </form>
        </section>
        <section className="panel wide-panel">
          <h2>Payments</h2>
          {summary.payments.length === 0 ? renderEmpty("payments") : (
            <div className="subscription-list">
              {summary.payments.map((payment) => (
                <div className="subscription-row" key={payment._id}>
                  <div>
                    <strong>{payment.clientName}</strong>
                    <span>{payment.provider} - {dateLabel(payment.paidAt)}</span>
                  </div>
                  <div>
                    <strong>{money(payment.amount)}</strong>
                    <span className={`status-pill ${payment.status}`}>{payment.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </section>,
    );
  }

  if (view === "subscriptions") {
    return renderShell(
      <section className="content-grid">
        <section className="panel">
          <p className="eyebrow">Recurring plans</p>
          <h2>Add subscription</h2>
          <form
            className="stack form-section"
            onSubmit={(e) =>
              submitAndRefresh(e, () => createSubscription(subscriptionForm), "Subscription added.")
            }
          >
            <input className="form-control" name="clientName" placeholder="Client name" value={subscriptionForm.clientName} onChange={handleFormChange(setSubscriptionForm)} />
            <input className="form-control" name="planName" placeholder="Plan name" value={subscriptionForm.planName} onChange={handleFormChange(setSubscriptionForm)} />
            <input className="form-control" name="amount" type="number" placeholder="Amount" value={subscriptionForm.amount} onChange={handleFormChange(setSubscriptionForm)} />
            <select className="form-select" name="interval" value={subscriptionForm.interval} onChange={handleFormChange(setSubscriptionForm)}>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
            <select className="form-select" name="status" value={subscriptionForm.status} onChange={handleFormChange(setSubscriptionForm)}>
              <option value="trial">Trial</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="canceled">Canceled</option>
            </select>
            <button className="btn btn-primary">Save subscription</button>
          </form>
        </section>
        <section className="panel wide-panel">
          <h2>Subscriptions</h2>
          {summary.subscriptions.length === 0 ? renderEmpty("subscriptions") : (
            <div className="subscription-list">
              {summary.subscriptions.map((subscription) => (
                <div className="subscription-row" key={subscription._id}>
                  <div>
                    <strong>{subscription.clientName}</strong>
                    <span>{subscription.planName}</span>
                  </div>
                  <div>
                    <strong>{money(subscription.amount)} / {subscription.interval}</strong>
                    <span className={`status-pill ${subscription.status}`}>{subscription.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </section>,
    );
  }

  if (view === "team") {
    return renderShell(
      <TeamPage
        canInvite={canInvite}
        refreshKey={inviteRefreshKey}
        onInviteCreated={() => setInviteRefreshKey((value) => value + 1)}
      />,
    );
  }

  return renderShell(
    <>
      {metrics}
      <section className="content-grid">
        {invoiceTable}
        <section className="panel">
          <p className="eyebrow">Clients</p>
          <h2>Recent clients</h2>
          {summary.clients.length === 0 ? renderEmpty("clients") : (
            <div className="subscription-list">
              {summary.clients.slice(0, 4).map((client) => (
                <div className="subscription-row" key={client._id}>
                  <div>
                    <strong>{client.name}</strong>
                    <span>{client.billingAddress || "No billing address"}</span>
                    <span>{client.currency || "USD"} billing</span>
                  </div>
                  <div>
                    <span>{client.taxId || "No tax ID"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
        <section className="panel wide-panel">
          <div className="section-header">
            <div>
              <p className="eyebrow">Recurring plans</p>
              <h2>Subscriptions</h2>
            </div>
            <NavLink className="btn btn-outline-dark" to="/subscriptions">
              Manage
            </NavLink>
          </div>
          {summary.subscriptions.length === 0 ? renderEmpty("subscriptions") : (
            <div className="subscription-list">
              {summary.subscriptions.map((subscription) => (
                <div className="subscription-row" key={subscription._id}>
                  <div>
                    <strong>{subscription.clientName}</strong>
                    <span>{subscription.planName}</span>
                  </div>
                  <div>
                    <strong>{money(subscription.amount)} / {subscription.interval}</strong>
                    <span className={`status-pill ${subscription.status}`}>{subscription.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </section>
    </>,
  );
};

export default Dashboard;
