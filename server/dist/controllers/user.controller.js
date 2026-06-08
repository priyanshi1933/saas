"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsers = exports.getProfile = void 0;
const user_service_1 = require("../services/user.service");
const getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await (0, user_service_1.getUserProfile)(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        res.json({ success: true, data: user });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getProfile = getProfile;
const getUsers = async (_req, res) => {
    try {
        const users = await (0, user_service_1.getUser)();
        res.json(users);
    }
    catch (error) {
        res.status(400).json({ message: "No User Available" });
    }
};
exports.getUsers = getUsers;
