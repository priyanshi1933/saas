"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createClientForOrganization = exports.getClientsByOrganization = void 0;
const client_model_1 = require("../models/client.model");
const getClientsByOrganization = async (organizationId) => {
    return await client_model_1.ClientModel.find({ organizationId }).sort({ createdAt: -1 });
};
exports.getClientsByOrganization = getClientsByOrganization;
const createClientForOrganization = async (input) => {
    return await client_model_1.ClientModel.create(input);
};
exports.createClientForOrganization = createClientForOrganization;
