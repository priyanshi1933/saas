"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSubscription = exports.getSubscriptions = void 0;
const subscription_service_1 = require("../services/subscription.service");
const validation_1 = require("../validation");
const helpers_1 = require("./helpers");
const getSubscriptions = async (req, res) => {
    try {
        const organizationId = (0, helpers_1.getOrganizationId)(req);
        const subscriptions = await (0, subscription_service_1.getSubscriptionsByOrganization)(organizationId);
        res.json({ success: true, data: subscriptions });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.getSubscriptions = getSubscriptions;
const createSubscription = async (req, res) => {
    try {
        const organizationId = (0, helpers_1.getOrganizationId)(req);
        const input = (0, validation_1.validateBody)(validation_1.subscriptionSchema, req.body);
        const subscriptionResult = await (0, subscription_service_1.createSubscriptionForOrganization)({ organizationId, ...input });
        res.status(201).json({ success: true, data: subscriptionResult });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.createSubscription = createSubscription;
