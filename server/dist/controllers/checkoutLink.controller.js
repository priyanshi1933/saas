"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
<<<<<<< HEAD
exports.completePublicCheckoutLink = exports.getPublicCheckoutLink = exports.createSubscriptionCheckoutLinkController = exports.createInvoiceCheckoutLinkController = void 0;
=======
exports.createPublicRazorpayCheckout = exports.completePublicCheckoutLink = exports.getPublicCheckoutLink = exports.createSubscriptionCheckoutLinkController = exports.createInvoiceCheckoutLinkController = void 0;
>>>>>>> c3eebe6 (first commit)
const checkoutLink_service_1 = require("../services/checkoutLink.service");
const helpers_1 = require("./helpers");
const param = (value) => (Array.isArray(value) ? value[0] : value);
const createInvoiceCheckoutLinkController = async (req, res) => {
    try {
        const organizationId = (0, helpers_1.getOrganizationId)(req);
        const result = await (0, checkoutLink_service_1.createInvoiceCheckoutLink)(organizationId, param(req.params.invoiceId));
        res.status(201).json({ success: true, data: result });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.createInvoiceCheckoutLinkController = createInvoiceCheckoutLinkController;
const createSubscriptionCheckoutLinkController = async (req, res) => {
    try {
        const organizationId = (0, helpers_1.getOrganizationId)(req);
        const result = await (0, checkoutLink_service_1.createSubscriptionCheckoutLink)(organizationId, param(req.params.subscriptionId));
        res.status(201).json({ success: true, data: result });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.createSubscriptionCheckoutLinkController = createSubscriptionCheckoutLinkController;
const getPublicCheckoutLink = async (req, res) => {
    try {
        const checkoutLink = await (0, checkoutLink_service_1.getCheckoutLinkByToken)(param(req.params.token));
        res.json({
            success: true,
            data: {
                token: checkoutLink.token,
                resourceType: checkoutLink.resourceType,
                clientName: checkoutLink.clientName,
                title: checkoutLink.title,
                amount: checkoutLink.amount,
<<<<<<< HEAD
=======
                currency: (process.env.RAZORPAY_CURRENCY || "INR").toUpperCase(),
>>>>>>> c3eebe6 (first commit)
            },
        });
    }
    catch (error) {
        res.status(404).json({ message: error.message });
    }
};
exports.getPublicCheckoutLink = getPublicCheckoutLink;
const completePublicCheckoutLink = async (req, res) => {
    try {
<<<<<<< HEAD
        const checkoutLink = await (0, checkoutLink_service_1.completeCheckoutLink)(param(req.params.token));
=======
        const checkoutLink = await (0, checkoutLink_service_1.completeCheckoutLink)(param(req.params.token), req.body);
>>>>>>> c3eebe6 (first commit)
        res.json({
            success: true,
            data: {
                resourceType: checkoutLink.resourceType,
                clientName: checkoutLink.clientName,
                amount: checkoutLink.amount,
                status: checkoutLink.status,
            },
        });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.completePublicCheckoutLink = completePublicCheckoutLink;
<<<<<<< HEAD
=======
const createPublicRazorpayCheckout = async (req, res) => {
    try {
        const checkout = await (0, checkoutLink_service_1.createRazorpayCheckoutForToken)(param(req.params.token));
        res.status(201).json({ success: true, data: checkout });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.createPublicRazorpayCheckout = createPublicRazorpayCheckout;
>>>>>>> c3eebe6 (first commit)
