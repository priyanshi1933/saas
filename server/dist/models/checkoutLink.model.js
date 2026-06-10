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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckoutLinkModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const CheckoutLinkSchema = new mongoose_1.Schema({
    organizationId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Organization",
        required: true,
        index: true,
    },
    resourceType: {
        type: String,
        enum: ["invoice", "subscription"],
        required: true,
    },
    resourceId: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: true,
    },
    token: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    clientName: {
        type: String,
        required: true,
        trim: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
    },
    amount: {
        type: Number,
        required: true,
        min: 0,
    },
    status: {
        type: String,
        enum: ["active", "completed", "expired"],
        default: "active",
    },
<<<<<<< HEAD
=======
    razorpayOrderId: {
        type: String,
        trim: true,
        index: true,
    },
    razorpaySubscriptionId: {
        type: String,
        trim: true,
        index: true,
    },
    razorpayPlanId: {
        type: String,
        trim: true,
    },
>>>>>>> c3eebe6 (first commit)
    expiresAt: Date,
    completedAt: Date,
}, { timestamps: true });
CheckoutLinkSchema.index({ organizationId: 1, resourceType: 1, resourceId: 1, status: 1 });
exports.CheckoutLinkModel = mongoose_1.default.model("CheckoutLink", CheckoutLinkSchema);
