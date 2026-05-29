import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import {
  createClient,
  createInvoice,
  createPayment,
  createSubscription,
  getWorkspaceSummary,
  updateInvoiceStatus as updateInvoiceStatusApi,
} from "../Api/auth";
import {
  clientSchema,
  invoiceSchema,
  invoiceStatusValues,
  paymentSchema,
  subscriptionSchema,
  validateWithJoi,
} from "../Validation/userSchema";
import TeamPage from "./TeamPage";
import { useSettings } from "../SettingsContext";

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
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);
};

const dateLabel = (value: string) => {
  return value ? new Date(value).toLocaleDateString() : "";
};

const Dashboard = ({ view }: DashboardProps) => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useSettings();
  const organizationName = localStorage.getItem("organizationName") || localStorage.getItem("workspaceName") || "Workspace";
  const firstName = localStorage.getItem("firstName") || "";
  const lastName = localStorage.getItem("lastName") || "";
  const userEmail = localStorage.getItem("userEmail") || "";
  const role = localStorage.getItem("role") || "member";
  const [summary, setSummary] = useState<Summary>(emptySummary);
  const [message, setMessage] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
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
    status: "draft",
    dueDate: "",
    taxRate: "0",
    discountAmount: "0",
    lineItems: [
      {
        description: "",
        quantity: "1",
        unitPrice: "0",
      },
    ],
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
  const canManageClients = useMemo(() => ["owner", "admin"].includes(role), [role]);
  const canManageInvoices = useMemo(() => ["owner", "admin"].includes(role), [role]);

  // Alerts are now dismissible only via the close button; auto-dismiss removed.

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
    <T extends Record<string, unknown>>(setter: React.Dispatch<React.SetStateAction<T>>) =>
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setter((prev) => ({ ...prev, [name]: value } as T));
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    };

  const handleLineItemChange = (index: number) =>
    (e: ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setInvoiceForm((prev) => ({
        ...prev,
        lineItems: prev.lineItems.map((item, itemIndex) =>
          itemIndex === index ? { ...item, [name]: value } : item,
        ),
      }));
    };

  const addInvoiceLineItem = () => {
    setInvoiceForm((prev) => ({
      ...prev,
      lineItems: [
        ...prev.lineItems,
        { description: "", quantity: "1", unitPrice: "0" },
      ],
    }));
  };

  const removeInvoiceLineItem = (index: number) => {
    setInvoiceForm((prev) => ({
      ...prev,
      lineItems:
        prev.lineItems.length > 1
          ? prev.lineItems.filter((_, itemIndex) => itemIndex !== index)
          : [
              {
                description: "",
                quantity: "1",
                unitPrice: "0",
              },
            ],
    }));
  };

  const handleInvoiceStatusChange = async (invoiceId: string, status: string) => {
    try {
      await updateInvoiceStatusApi(invoiceId, status);
      await loadSummary();
      setMessage("Invoice status updated.");
    } catch (error: any) {
      setMessage(error.response?.data?.message || "Could not update invoice status");
    }
  };

  const subtotal = invoiceForm.lineItems.reduce(
    (sum, item) => sum + Number(item.quantity) * Number(item.unitPrice),
    0,
  );

  const taxRate = Number(invoiceForm.taxRate) || 0;
  const discountAmount = Number(invoiceForm.discountAmount) || 0;
  const taxAmount = Math.round((subtotal * taxRate) / 100 * 100) / 100;
  const totalAmount = Math.max(0, Math.round((subtotal + taxAmount - discountAmount) * 100) / 100);

  const downloadInvoicePdf = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    doc.setFontSize(18);
    doc.text("Invoice", 40, 50);
    doc.setFontSize(11);
    doc.text(`Client: ${invoiceForm.clientName || "-"}`, 40, 80);
    doc.text(`Invoice #: ${invoiceForm.invoiceNumber || "-"}`, 40, 100);
    doc.text(`Due date: ${invoiceForm.dueDate || "-"}`, 40, 120);
    doc.text(`Status: ${invoiceForm.status}`, 40, 140);
    doc.text(`Tax rate: ${taxRate}%`, 40, 160);
    doc.text(`Discount: ${money(discountAmount)}`, 200, 160);

    const headerY = 190;
    const rowHeight = 20;

    doc.setFontSize(10);
    doc.text("Description", 40, headerY);
    doc.text("Qty", 280, headerY);
    doc.text("Unit", 335, headerY);
    doc.text("Line total", 430, headerY);

    invoiceForm.lineItems.forEach((item, index) => {
      const rowY = headerY + rowHeight * (index + 1);
      doc.text(item.description || "-", 40, rowY);
      doc.text(String(item.quantity), 280, rowY);
      doc.text(Number(item.unitPrice).toFixed(2), 335, rowY);
      doc.text(money(Number(item.quantity) * Number(item.unitPrice)), 430, rowY);
    });

    const footerY = headerY + rowHeight * (invoiceForm.lineItems.length + 2);
    doc.text(`Subtotal: ${money(subtotal)}`, 40, footerY);
    doc.text(`Tax: ${money(taxAmount)}`, 40, footerY + 20);
    doc.text(`Discount: ${money(discountAmount)}`, 40, footerY + 40);
    doc.setFontSize(12);
    doc.text(`Total: ${money(totalAmount)}`, 40, footerY + 70);

    doc.save(`invoice-${invoiceForm.invoiceNumber || "draft"}.pdf`);
  };

  const submitAndRefresh = async <T extends Record<string, unknown>>(
    e: FormEvent,
    schema: Parameters<typeof validateWithJoi>[0],
    values: T,
    action: (validatedValues: T) => Promise<unknown>,
    successMessage: string,
  ) => {
    e.preventDefault();
    const { errors, isValid, value } = validateWithJoi(schema, values);
    setFormErrors(errors as Record<string, string>);
    if (!isValid) {
      return;
    }

    try {
      await action(value);
      await loadSummary();
      setFormErrors({});
      setMessage(successMessage);
    } catch (error: any) {
      setMessage(error.response?.data?.message || "Could not save data");
    }
  };

  const pageTitle: Record<View, string> = {
    dashboard: "dashboard",
    clients: "clients",
    invoices: "invoices",
    payments: "payments",
    subscriptions: "subscriptions",
    team: "team",
  };

  const renderEmpty = (label: string) => <p className="muted empty-state">No {label} added yet.</p>;

  const renderShell = (children: ReactNode) => (
    <main className="dashboard-shell">
      <aside className="sidebar">
        <div>
          <div className="brand-mark">S</div>
          <h1>SaaS Billing</h1>
          <p>{organizationName}</p>
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
            <h2>{pageTitle[view].charAt(0).toUpperCase() + pageTitle[view].slice(1)}</h2>
          </div>
          <div className="topbar-actions">
            <button type="button" className="btn btn-primary btn-sm" onClick={toggleTheme}>
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </button>
            <div className="user-chip">
              <div>
                <span>{`${firstName} ${lastName}`.trim() || userEmail}</span>
                <small>{role.replace("_", " ")}</small>
              </div>
            </div>
          </div>
        </header>
        {message && (
          <div className="alert alert-info py-2 alert-dismissible fade show" role="alert">
            <div>{message}</div>
            <button type="button" className="btn-close" aria-label="Close" onClick={() => setMessage("")} />
          </div>
        )}
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
                    {canManageInvoices ? (
                      <select
                        className="form-select"
                        value={invoice.status}
                        onChange={(e) => handleInvoiceStatusChange(invoice._id, e.target.value)}
                      >
                        {invoiceStatusValues.map((statusValue) => (
                          <option key={statusValue} value={statusValue}>
                            {statusValue}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className={`status-pill ${invoice.status}`}>{invoice.status}</span>
                    )}
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
          {canManageClients ? (
            <form
              className="stack"
              onSubmit={(e) =>
                submitAndRefresh(e, clientSchema, clientForm, createClient, "Client added.")
              }
            >
              <label className="form-label">Client name</label>
              <input className={`form-control ${formErrors.name ? "is-invalid" : ""}`} name="name" placeholder="Client name" value={clientForm.name} onChange={handleFormChange(setClientForm)} />
              <span className="invalid-feedback">{formErrors.name}</span>

              <label className="form-label">Tax ID</label>
              <input className={`form-control ${formErrors.taxId ? "is-invalid" : ""}`} name="taxId" placeholder="Tax ID / GST / VAT" value={clientForm.taxId} onChange={handleFormChange(setClientForm)} />
              <span className="invalid-feedback">{formErrors.taxId}</span>

              <label className="form-label">Currency</label>
              <select className={`form-select ${formErrors.currency ? "is-invalid" : ""}`} name="currency" value={clientForm.currency} onChange={handleFormChange(setClientForm)}>
                <option value="USD">USD - US Dollar</option>
                <option value="INR">INR - Indian Rupee</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="AUD">AUD - Australian Dollar</option>
                <option value="CAD">CAD - Canadian Dollar</option>
              </select>
              <span className="invalid-feedback">{formErrors.currency}</span>

              <label className="form-label">Billing address</label>
              <textarea
                className={`form-control ${formErrors.billingAddress ? "is-invalid" : ""}`}
                name="billingAddress"
                placeholder="Billing address"
                value={clientForm.billingAddress}
                onChange={handleFormChange(setClientForm)}
                rows={4}
              />
              <span className="invalid-feedback">{formErrors.billingAddress}</span>

              <button className="btn btn-primary">Save client</button>
            </form>
          ) : (
            <p className="muted">Only owners and admins can create clients.</p>
          )}
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
          {canManageInvoices ? (
            <form
              className="stack form-section"
              onSubmit={(e) =>
                submitAndRefresh(
                  e,
                  invoiceSchema,
                  invoiceForm,
                  createInvoice,
                  "Invoice added.",
                )
              }
            >
              <label className="form-label">Client name</label>
              <input className={`form-control ${formErrors.clientName ? "is-invalid" : ""}`} name="clientName" placeholder="Client name" value={invoiceForm.clientName} onChange={handleFormChange(setInvoiceForm)} />
              <span className="invalid-feedback">{formErrors.clientName}</span>

              <label className="form-label">Invoice number</label>
              <input className={`form-control ${formErrors.invoiceNumber ? "is-invalid" : ""}`} name="invoiceNumber" placeholder="Invoice number" value={invoiceForm.invoiceNumber} onChange={handleFormChange(setInvoiceForm)} />
              <span className="invalid-feedback">{formErrors.invoiceNumber}</span>

              <div className="panel nested-panel">
                <h3>Line items</h3>
                {invoiceForm.lineItems.map((item, index) => (
                  <div className="line-item-row" key={index}>
                    <div style={{ flex: 1 }}>
                      <label className="form-label">Description</label>
                      <input
                        className={`form-control ${formErrors.description ? "is-invalid" : ""}`}
                        name="description"
                        placeholder="Description"
                        value={item.description}
                        onChange={handleLineItemChange(index)}
                      />
                    </div>
                    <div style={{ width: 100 }}>
                      <label className="form-label">Qty</label>
                      <input
                        className={`form-control ${formErrors.quantity ? "is-invalid" : ""}`}
                        name="quantity"
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={handleLineItemChange(index)}
                      />
                    </div>
                    <div style={{ width: 140 }}>
                      <label className="form-label">Unit</label>
                      <input
                        className={`form-control ${formErrors.unitPrice ? "is-invalid" : ""}`}
                        name="unitPrice"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Unit price"
                        value={item.unitPrice}
                        onChange={handleLineItemChange(index)}
                      />
                    </div>
                    <div style={{ alignSelf: "end" }}>
                      <button type="button" className="btn btn-danger btn-sm" onClick={() => removeInvoiceLineItem(index)}>
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                <button type="button" className="btn btn-primary" onClick={addInvoiceLineItem}>
                  Add line item
                </button>
              </div>

              <div className="grid grid-2 gap-2">
                <div>
                  <label className="form-label">Tax rate (%)</label>
                  <input
                    className={`form-control ${formErrors.taxRate ? "is-invalid" : ""}`}
                    name="taxRate"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Tax rate (%)"
                    value={invoiceForm.taxRate}
                    onChange={handleFormChange(setInvoiceForm)}
                  />
                  <span className="invalid-feedback">{formErrors.taxRate}</span>
                </div>
                <div>
                  <label className="form-label">Discount amount</label>
                  <input
                    className={`form-control ${formErrors.discountAmount ? "is-invalid" : ""}`}
                    name="discountAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Discount amount"
                    value={invoiceForm.discountAmount}
                    onChange={handleFormChange(setInvoiceForm)}
                  />
                  <span className="invalid-feedback">{formErrors.discountAmount}</span>
                </div>
              </div>

              <input className={`form-control ${formErrors.dueDate ? "is-invalid" : ""}`} name="dueDate" type="date" value={invoiceForm.dueDate} onChange={handleFormChange(setInvoiceForm)} />
              <span className="invalid-feedback">{formErrors.dueDate}</span>
              <select className={`form-select ${formErrors.status ? "is-invalid" : ""}`} name="status" value={invoiceForm.status} onChange={handleFormChange(setInvoiceForm)}>
                <option value="draft">Draft</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
              <span className="invalid-feedback">{formErrors.status}</span>

              <div className="invoice-totals">
                <div>Subtotal: {money(subtotal)}</div>
                <div>Tax: {money(taxAmount)}</div>
                <div>Discount: {money(discountAmount)}</div>
                <div className="total-row">Total: {money(totalAmount)}</div>
              </div>

              <div className="button-row">
                <button type="button" className="btn btn-secondary" onClick={downloadInvoicePdf}>
                  Download PDF
                </button>
                <button className="btn btn-primary">Save invoice</button>
              </div>
            </form>
          ) : (
            <p className="muted">Only owners and admins can create invoices.</p>
          )}
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
              submitAndRefresh(e, paymentSchema, paymentForm, createPayment, "Payment added.")
            }
          >
            <input className={`form-control ${formErrors.clientName ? "is-invalid" : ""}`} name="clientName" placeholder="Client name" value={paymentForm.clientName} onChange={handleFormChange(setPaymentForm)} />
            <span className="invalid-feedback">{formErrors.clientName}</span>
            <input className={`form-control ${formErrors.amount ? "is-invalid" : ""}`} name="amount" type="number" placeholder="Amount" value={paymentForm.amount} onChange={handleFormChange(setPaymentForm)} />
            <span className="invalid-feedback">{formErrors.amount}</span>
            <input className={`form-control ${formErrors.provider ? "is-invalid" : ""}`} name="provider" placeholder="Provider" value={paymentForm.provider} onChange={handleFormChange(setPaymentForm)} />
            <span className="invalid-feedback">{formErrors.provider}</span>
            <input className={`form-control ${formErrors.paidAt ? "is-invalid" : ""}`} name="paidAt" type="date" value={paymentForm.paidAt} onChange={handleFormChange(setPaymentForm)} />
            <span className="invalid-feedback">{formErrors.paidAt}</span>
            <select className={`form-select ${formErrors.status ? "is-invalid" : ""}`} name="status" value={paymentForm.status} onChange={handleFormChange(setPaymentForm)}>
              <option value="succeeded">Succeeded</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
            <span className="invalid-feedback">{formErrors.status}</span>
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
              submitAndRefresh(e, subscriptionSchema, subscriptionForm, createSubscription, "Subscription added.")
            }
          >
            <input className={`form-control ${formErrors.clientName ? "is-invalid" : ""}`} name="clientName" placeholder="Client name" value={subscriptionForm.clientName} onChange={handleFormChange(setSubscriptionForm)} />
            <span className="invalid-feedback">{formErrors.clientName}</span>
            <input className={`form-control ${formErrors.planName ? "is-invalid" : ""}`} name="planName" placeholder="Plan name" value={subscriptionForm.planName} onChange={handleFormChange(setSubscriptionForm)} />
            <span className="invalid-feedback">{formErrors.planName}</span>
            <input className={`form-control ${formErrors.amount ? "is-invalid" : ""}`} name="amount" type="number" placeholder="Amount" value={subscriptionForm.amount} onChange={handleFormChange(setSubscriptionForm)} />
            <span className="invalid-feedback">{formErrors.amount}</span>
            <select className={`form-select ${formErrors.interval ? "is-invalid" : ""}`} name="interval" value={subscriptionForm.interval} onChange={handleFormChange(setSubscriptionForm)}>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
            <span className="invalid-feedback">{formErrors.interval}</span>
            <select className={`form-select ${formErrors.status ? "is-invalid" : ""}`} name="status" value={subscriptionForm.status} onChange={handleFormChange(setSubscriptionForm)}>
              <option value="trial">Trial</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="canceled">Canceled</option>
            </select>
            <span className="invalid-feedback">{formErrors.status}</span>
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
