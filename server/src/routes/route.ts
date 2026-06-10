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
<<<<<<< HEAD
import { createSubscription, getSubscriptions } from "../controllers/subscription.controller";
import { createStripePaymentSessionController, createStripeSubscriptionSessionController } from "../controllers/stripe.controller";
=======
import { cancelSubscriptionController, createSubscription, getSubscriptions } from "../controllers/subscription.controller";
>>>>>>> c3eebe6 (first commit)
import { getWorkspaceSummary } from "../controllers/workspace.controller";
import {
  completePublicCheckoutLink,
  createInvoiceCheckoutLinkController,
<<<<<<< HEAD
=======
  createPublicRazorpayCheckout,
>>>>>>> c3eebe6 (first commit)
  createSubscriptionCheckoutLinkController,
  getPublicCheckoutLink,
} from "../controllers/checkoutLink.controller";
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
router.post("/payments", verifyToken, authorize(["owner", "admin"]), createPayment);
<<<<<<< HEAD
router.post("/stripe/payment-session", verifyToken, createStripePaymentSessionController);
router.get("/subscriptions", verifyToken, getSubscriptions);
router.post("/subscriptions", verifyToken, authorize(["owner", "admin"]), createSubscription);
router.post("/stripe/subscription-session", verifyToken, createStripeSubscriptionSessionController);
router.post("/checkout-links/invoice/:invoiceId", verifyToken, authorize(["owner", "admin"]), createInvoiceCheckoutLinkController);
router.post("/checkout-links/subscription/:subscriptionId", verifyToken, authorize(["owner", "admin"]), createSubscriptionCheckoutLinkController);
router.get("/checkout/:token", getPublicCheckoutLink);
=======
router.get("/subscriptions", verifyToken, getSubscriptions);
router.post("/subscriptions", verifyToken, authorize(["owner", "admin"]), createSubscription);
router.patch("/subscriptions/:id/cancel",verifyToken, authorize(["owner", "admin"]), cancelSubscriptionController);
router.post("/checkout-links/invoice/:invoiceId", verifyToken, authorize(["owner", "admin"]), createInvoiceCheckoutLinkController);
router.post("/checkout-links/subscription/:subscriptionId", verifyToken, authorize(["owner", "admin"]), createSubscriptionCheckoutLinkController);
router.get("/checkout/:token", getPublicCheckoutLink);
router.post("/checkout/:token/razorpay", createPublicRazorpayCheckout);
>>>>>>> c3eebe6 (first commit)
router.post("/checkout/:token/complete", completePublicCheckoutLink);
router.get("/users", getUsers);
router.get("/profile", verifyToken, getProfile);

<<<<<<< HEAD
=======

router.get("/test-razorpay", async (req, res) => {
  try {
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "GET",
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
        ).toString("base64")}`,
      },
    });
    const data = await response.json();
    res.json({
      status: response.status,
      keyId: process.env.RAZORPAY_KEY_ID,
      keyLength: process.env.RAZORPAY_KEY_ID?.length,
      data,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

>>>>>>> c3eebe6 (first commit)
export default router;
