"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importStar(require("mongoose"));
const path_1 = __importDefault(require("path"));
const client_model_1 = require("./models/client.model");
const invoice_model_1 = require("./models/invoice.model");
const organization_model_1 = require("./models/organization.model");
const payment_model_1 = require("./models/payment.model");
const subscription_model_1 = require("./models/subscription.model");
const user_model_1 = require("./models/user.model");
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, "../.env.local") });
const getMongoUri = () => {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
        throw new Error("MONGO_URI is required");
    }
    const separator = mongoUri.includes("?") ? "&" : "?";
    return mongoUri.includes("retryWrites=") ? mongoUri : `${mongoUri}${separator}retryWrites=false`;
};
const seed = async () => {
    await mongoose_1.default.connect(getMongoUri(), { retryWrites: false });
    const existingOrg = await organization_model_1.OrganizationModel.findOne({ name: "Demo Ledger Studio" });
    if (existingOrg) {
        await Promise.all([
            user_model_1.UserModel.deleteMany({ organizationId: existingOrg._id }),
            client_model_1.ClientModel.deleteMany({ organizationId: existingOrg._id }),
            invoice_model_1.InvoiceModel.deleteMany({ organizationId: existingOrg._id }),
            payment_model_1.PaymentModel.deleteMany({ organizationId: existingOrg._id }),
            subscription_model_1.SubscriptionModel.deleteMany({ organizationId: existingOrg._id }),
            organization_model_1.OrganizationModel.deleteOne({ _id: existingOrg._id }),
        ]);
    }
    const ownerId = new mongoose_1.Types.ObjectId();
    const org = await organization_model_1.OrganizationModel.create({
        name: "Demo Ledger Studio",
        owner: ownerId,
        members: [ownerId],
    });
    await user_model_1.UserModel.create({
        _id: ownerId,
        email: "owner@demo.test",
        password: await bcryptjs_1.default.hash("password123", 10),
        firstName: "Avery",
        lastName: "Stone",
        role: "owner",
        organizationId: org._id,
    });
    await client_model_1.ClientModel.insertMany([
        {
            organizationId: org._id,
            name: "Northstar Labs",
            taxId: "US-839201",
            billingAddress: "118 Market Street, San Francisco, CA",
            currency: "USD",
        },
        {
            organizationId: org._id,
            name: "Blue Orbit Agency",
            taxId: "GST-27BLUE9021",
            billingAddress: "Koramangala, Bengaluru, India",
            currency: "INR",
        },
        {
            organizationId: org._id,
            name: "Vesper Analytics",
            taxId: "EU-VAT-44219",
            billingAddress: "Friedrichstrasse 68, Berlin",
            currency: "EUR",
        },
    ]);
    await invoice_model_1.InvoiceModel.insertMany([
        {
            organizationId: org._id,
            clientName: "Northstar Labs",
            invoiceNumber: "INV-1001",
            lineItems: [{ description: "Product strategy sprint", quantity: 1, unitPrice: 4200, total: 4200 }],
            subtotal: 4200,
            taxRate: 8,
            discountAmount: 200,
            amount: 4136,
            status: "pending",
            dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10),
        },
        {
            organizationId: org._id,
            clientName: "Blue Orbit Agency",
            invoiceNumber: "INV-1002",
            lineItems: [{ description: "Retainer implementation", quantity: 1, unitPrice: 2600, total: 2600 }],
            subtotal: 2600,
            taxRate: 0,
            discountAmount: 0,
            amount: 2600,
            status: "paid",
            dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4),
        },
        {
            organizationId: org._id,
            clientName: "Vesper Analytics",
            invoiceNumber: "INV-1003",
            lineItems: [{ description: "Billing data migration", quantity: 1, unitPrice: 1800, total: 1800 }],
            subtotal: 1800,
            taxRate: 0,
            discountAmount: 0,
            amount: 1800,
            status: "overdue",
            dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8),
        },
    ]);
    await payment_model_1.PaymentModel.insertMany([
        {
            organizationId: org._id,
            clientName: "Blue Orbit Agency",
            amount: 2600,
<<<<<<< HEAD
            provider: "Stripe",
=======
            provider: "Razorpay Test",
>>>>>>> c3eebe6 (first commit)
            status: "succeeded",
            paidAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
        },
        {
            organizationId: org._id,
            clientName: "Northstar Labs",
            amount: 1200,
<<<<<<< HEAD
            provider: "Stripe",
=======
            provider: "Razorpay Test",
>>>>>>> c3eebe6 (first commit)
            status: "succeeded",
            paidAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14),
        },
    ]);
    await subscription_model_1.SubscriptionModel.insertMany([
        {
            organizationId: org._id,
            clientName: "Northstar Labs",
            planName: "Growth retainer",
            amount: 1800,
            billingCycle: "monthly",
            status: "active",
            nextBillingDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 18),
        },
        {
            organizationId: org._id,
            clientName: "Vesper Analytics",
            planName: "Annual platform support",
            amount: 14400,
            billingCycle: "yearly",
            status: "active",
            nextBillingDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 42),
        },
    ]);
    console.log("Seed complete.");
    console.log("Login: owner@demo.test / password123");
    await mongoose_1.default.disconnect();
};
seed().catch(async (error) => {
    console.error(error);
    await mongoose_1.default.disconnect();
    process.exit(1);
});
