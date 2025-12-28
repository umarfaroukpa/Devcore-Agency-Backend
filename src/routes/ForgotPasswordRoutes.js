"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ForgotPassword_controllers_1 = require("../controllers/ForgotPassword.controllers");
const authRouter = (0, express_1.Router)();
// Public routes
authRouter.post('/forgot-password', ForgotPassword_controllers_1.forgotPassword);
authRouter.post('/reset-password/:token', ForgotPassword_controllers_1.resetPassword);
authRouter.get('/verify-reset-token/:token', ForgotPassword_controllers_1.verifyResetToken);
exports.default = authRouter;
