"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWorkspaceSummary = void 0;
const workspace_service_1 = require("../services/workspace.service");
const helpers_1 = require("./helpers");
const getWorkspaceSummary = async (req, res) => {
    try {
        const organizationId = (0, helpers_1.getOrganizationId)(req);
        const summary = await (0, workspace_service_1.getWorkspaceSummaryForOrganization)(organizationId);
        res.json({ success: true, data: summary });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.getWorkspaceSummary = getWorkspaceSummary;
