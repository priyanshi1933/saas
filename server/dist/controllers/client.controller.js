"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createClient = exports.getClients = void 0;
const client_service_1 = require("../services/client.service");
const validation_1 = require("../validation");
const helpers_1 = require("./helpers");
const getClients = async (req, res) => {
    try {
        const organizationId = (0, helpers_1.getOrganizationId)(req);
        const clients = await (0, client_service_1.getClientsByOrganization)(organizationId);
        res.json({ success: true, data: clients });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.getClients = getClients;
const createClient = async (req, res) => {
    try {
        const organizationId = (0, helpers_1.getOrganizationId)(req);
        const input = (0, validation_1.validateBody)(validation_1.clientSchema, req.body);
        const client = await (0, client_service_1.createClientForOrganization)({ organizationId, ...input });
        res.status(201).json({ success: true, data: client });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.createClient = createClient;
