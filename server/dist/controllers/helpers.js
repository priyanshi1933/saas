"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrganizationId = void 0;
const getOrganizationId = (req) => {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new Error("Organization context is required");
    }
    return organizationId;
};
exports.getOrganizationId = getOrganizationId;
