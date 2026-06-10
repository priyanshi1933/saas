"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const route_1 = __importDefault(require("./routes/route"));
<<<<<<< HEAD
const stripe_controller_1 = require("./controllers/stripe.controller");
=======
const razorpay_controller_1 = require("./controllers/razorpay.controller");
>>>>>>> c3eebe6 (first commit)
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, "../.env.local") });
const getMongoUri = () => {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
        throw new Error("MONGO_URI is required");
    }
    const separator = mongoUri.includes("?") ? "&" : "?";
    return mongoUri.includes("retryWrites=") ? mongoUri : `${mongoUri}${separator}retryWrites=false`;
};
const connectionString = getMongoUri();
const PORT = process.env.PORT || 3001;
mongoose_1.default
    .connect(connectionString, { retryWrites: false })
    .then(() => console.log("MongoDB Connected Successfully"))
    .catch((err) => console.log(err));
const corsOptions = {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
};
const app = (0, express_1.default)();
app.set('trust proxy', 1);
<<<<<<< HEAD
app.post("/webhooks/stripe", express_1.default.raw({ type: "application/json" }), stripe_controller_1.stripeWebhookHandler);
=======
app.post("/webhooks/razorpay", express_1.default.raw({ type: "application/json" }), razorpay_controller_1.razorpayWebhookHandler);
>>>>>>> c3eebe6 (first commit)
app.use(express_1.default.json());
app.use((0, cors_1.default)(corsOptions));
app.use(route_1.default);
app.use("/uploads", express_1.default.static(path_1.default.join(process.cwd(), "uploads")));
app.listen(PORT, () => {
    console.log(`Server is running on PORT ${PORT}`);
});
