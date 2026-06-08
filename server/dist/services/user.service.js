"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserProfile = exports.getUser = void 0;
const user_model_1 = require("../models/user.model");
const getUser = async () => {
    return await user_model_1.UserModel.find().select("-password");
};
exports.getUser = getUser;
const getUserProfile = async (userId) => {
    return await user_model_1.UserModel.findById(userId).select("-password");
};
exports.getUserProfile = getUserProfile;
