import axios from "axios";

const API_URL = "http://localhost:3000";

export const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const registerUser = (name: string, email: string, password: string, role: string) => {
  return api.post("/register", { name, email, password, role });
};

export const tenantSignup = (organizationName: string, email: string, password: string, firstName?: string, lastName?: string) => {
  return api.post("/tenant-signup", { organizationName, email, password, firstName, lastName });
};

export const loginUser = (email: string, password: string) => {
  return api.post("/login", { email, password });
};

export const createInvitation = (email: string, role: string) => {
  return api.post("/invite", { email, role });
};

export const getInvitations = () => {
  return api.get("/invites");
};

export const getTeamMembers = () => {
  return api.get("/team/members");
};

export const getWorkspaceSummary = () => {
  return api.get("/workspace/summary");
};

export const createClient = (data: {
  name: string;
  taxId: string;
  billingAddress: string;
  currency: string;
}) => {
  return api.post("/clients", data);
};

export const createInvoice = (data: {
  clientName: string;
  invoiceNumber: string;
  status: string;
  dueDate: string | Date;
  lineItems: Array<{ description: string; quantity: string | number; unitPrice: string | number }>;
  taxRate: string | number;
  discountAmount: string | number;
}) => {
  return api.post("/invoices", data);
};

export const updateInvoiceStatus = (invoiceId: string, status: string) => {
  return api.patch(`/invoices/${invoiceId}/status`, { status });
};

export const createPayment = (data: {
  clientName: string;
  amount: string | number;
  provider: string;
  status: string;
  paidAt: string | Date;
}) => {
  return api.post("/payments", data);
};

export const createSubscription = (data: {
  clientName: string;
  planName: string;
  amount: string | number;
  interval: string;
  status: string;
}) => {
  return api.post("/subscriptions", data);
};

export const acceptInvitation = (token: string, email: string, password: string) => {
  return api.post("/invite/accept", { token, email, password });
};

export const getProfile = () => {
  return api.get("/profile");
};
