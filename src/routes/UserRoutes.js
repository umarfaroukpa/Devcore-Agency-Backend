"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Auth_middleware_1 = require("../middleware/Auth.middleware");
const User_controller_1 = require("../controllers/User.controller");
const router = (0, express_1.Router)();
// Apply protection to all user routes
router.use(Auth_middleware_1.authenticate);
// GET /api/users/me - Get the logged-in user's profile
router.get('/me', User_controller_1.getMyProfile);
// PATCH /api/users/updateMyProfile - Update the logged-in user's profile details (e.g., name, non-sensitive data)
router.patch('/updateMyProfile', User_controller_1.updateMyProfile);
// PATCH /api/users/updateMyPassword - Update the logged-in user's password
router.patch('/updateMyPassword', User_controller_1.updateMyPassword);
exports.default = router;
