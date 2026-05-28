import express from "express";
import { loginUser, registerUser, tenantSignupUser } from "../controllers/auth.controller";
import {
  acceptInvitationUser,
  getInvitations,
  getTeamMembers,
  inviteUser,
} from "../controllers/invitation.controller";
import { getProfile, getUsers } from "../controllers/user.controller";
import { createClient, getClients } from "../controllers/client.controller";
import { createInvoice, getInvoices, updateInvoiceStatus } from "../controllers/invoice.controller";
import { createPayment, getPayments } from "../controllers/payment.controller";
import { createSubscription, getSubscriptions } from "../controllers/subscription.controller";
import { getWorkspaceSummary } from "../controllers/workspace.controller";
import { verifyToken, authorize } from "../middleware/auth";

const router = express.Router();

router.post("/register", registerUser);
router.post("/tenant-signup", tenantSignupUser);
router.post("/login", loginUser);
router.post("/invite", verifyToken, inviteUser);
router.get("/invites", verifyToken, getInvitations);
router.get("/team/members", verifyToken, getTeamMembers);
router.post("/invite/accept", acceptInvitationUser);
router.get("/workspace/summary", verifyToken, getWorkspaceSummary);
router.get("/clients", verifyToken, getClients);
router.post("/clients", verifyToken, authorize(["owner", "admin"]), createClient);
router.get("/invoices", verifyToken, getInvoices);
router.post("/invoices", verifyToken, authorize(["owner", "admin"]), createInvoice);
router.patch("/invoices/:id/status", verifyToken, authorize(["owner", "admin"]), updateInvoiceStatus);
router.get("/payments", verifyToken, getPayments);
router.post("/payments", verifyToken, createPayment);
router.get("/subscriptions", verifyToken, getSubscriptions);
router.post("/subscriptions", verifyToken, createSubscription);
router.get("/users", getUsers);
router.get("/profile", verifyToken, getProfile);

export default router;
