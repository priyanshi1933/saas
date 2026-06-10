"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_controller_1 = require("../controllers/auth.controller");
const invitation_controller_1 = require("../controllers/invitation.controller");
const user_controller_1 = require("../controllers/user.controller");
const client_controller_1 = require("../controllers/client.controller");
const invoice_controller_1 = require("../controllers/invoice.controller");
const payment_controller_1 = require("../controllers/payment.controller");
const subscription_controller_1 = require("../controllers/subscription.controller");
<<<<<<< HEAD
const stripe_controller_1 = require("../controllers/stripe.controller");
=======
>>>>>>> c3eebe6 (first commit)
const workspace_controller_1 = require("../controllers/workspace.controller");
const checkoutLink_controller_1 = require("../controllers/checkoutLink.controller");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.post("/register", auth_controller_1.registerUser);
router.post("/tenant-signup", auth_controller_1.tenantSignupUser);
router.post("/login", auth_controller_1.loginUser);
router.post("/invite", auth_1.verifyToken, invitation_controller_1.inviteUser);
router.get("/invites", auth_1.verifyToken, invitation_controller_1.getInvitations);
router.get("/team/members", auth_1.verifyToken, invitation_controller_1.getTeamMembers);
router.post("/invite/accept", invitation_controller_1.acceptInvitationUser);
router.get("/workspace/summary", auth_1.verifyToken, workspace_controller_1.getWorkspaceSummary);
router.get("/clients", auth_1.verifyToken, client_controller_1.getClients);
router.post("/clients", auth_1.verifyToken, (0, auth_1.authorize)(["owner", "admin"]), client_controller_1.createClient);
router.get("/invoices", auth_1.verifyToken, invoice_controller_1.getInvoices);
router.post("/invoices", auth_1.verifyToken, (0, auth_1.authorize)(["owner", "admin"]), invoice_controller_1.createInvoice);
router.patch("/invoices/:id/status", auth_1.verifyToken, (0, auth_1.authorize)(["owner", "admin"]), invoice_controller_1.updateInvoiceStatus);
router.get("/payments", auth_1.verifyToken, payment_controller_1.getPayments);
router.post("/payments", auth_1.verifyToken, (0, auth_1.authorize)(["owner", "admin"]), payment_controller_1.createPayment);
<<<<<<< HEAD
router.post("/stripe/payment-session", auth_1.verifyToken, stripe_controller_1.createStripePaymentSessionController);
router.get("/subscriptions", auth_1.verifyToken, subscription_controller_1.getSubscriptions);
router.post("/subscriptions", auth_1.verifyToken, (0, auth_1.authorize)(["owner", "admin"]), subscription_controller_1.createSubscription);
router.post("/stripe/subscription-session", auth_1.verifyToken, stripe_controller_1.createStripeSubscriptionSessionController);
router.post("/checkout-links/invoice/:invoiceId", auth_1.verifyToken, (0, auth_1.authorize)(["owner", "admin"]), checkoutLink_controller_1.createInvoiceCheckoutLinkController);
router.post("/checkout-links/subscription/:subscriptionId", auth_1.verifyToken, (0, auth_1.authorize)(["owner", "admin"]), checkoutLink_controller_1.createSubscriptionCheckoutLinkController);
router.get("/checkout/:token", checkoutLink_controller_1.getPublicCheckoutLink);
=======
router.get("/subscriptions", auth_1.verifyToken, subscription_controller_1.getSubscriptions);
router.post("/subscriptions", auth_1.verifyToken, (0, auth_1.authorize)(["owner", "admin"]), subscription_controller_1.createSubscription);
router.post("/checkout-links/invoice/:invoiceId", auth_1.verifyToken, (0, auth_1.authorize)(["owner", "admin"]), checkoutLink_controller_1.createInvoiceCheckoutLinkController);
router.post("/checkout-links/subscription/:subscriptionId", auth_1.verifyToken, (0, auth_1.authorize)(["owner", "admin"]), checkoutLink_controller_1.createSubscriptionCheckoutLinkController);
router.get("/checkout/:token", checkoutLink_controller_1.getPublicCheckoutLink);
router.post("/checkout/:token/razorpay", checkoutLink_controller_1.createPublicRazorpayCheckout);
>>>>>>> c3eebe6 (first commit)
router.post("/checkout/:token/complete", checkoutLink_controller_1.completePublicCheckoutLink);
router.get("/users", user_controller_1.getUsers);
router.get("/profile", auth_1.verifyToken, user_controller_1.getProfile);
exports.default = router;
