import express from "express";
import {
  registerUser,
  loginUser,
  getUsers,
  getProfile,
  tenantSignupUser,
  inviteUser,
  getInvitations,
  getTeamMembers,
  acceptInvitationUser,
} from "../controllers/user.controller";

import { verifyToken } from "../middleware/auth";
import {
  createClient,
  createInvoice,
  createPayment,
  createSubscription,
  getClients,
  getInvoices,
  getPayments,
  getSubscriptions,
  getWorkspaceSummary,
} from "../controllers/workspace.controller";

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
router.post("/clients", verifyToken, createClient);
router.get("/invoices", verifyToken, getInvoices);
router.post("/invoices", verifyToken, createInvoice);
router.get("/payments", verifyToken, getPayments);
router.post("/payments", verifyToken, createPayment);
router.get("/subscriptions", verifyToken, getSubscriptions);
router.post("/subscriptions", verifyToken, createSubscription);
router.get("/users", getUsers);
router.get("/profile", verifyToken, getProfile);

export default router;
