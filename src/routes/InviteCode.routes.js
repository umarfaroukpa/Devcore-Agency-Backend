"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Auth_middleware_1 = require("../middleware/Auth.middleware");
const InviteCode_controller_1 = require("../controllers/InviteCode.controller");
const inviteCodeRouter = (0, express_1.Router)();
// Admin only routes
inviteCodeRouter.post('/', Auth_middleware_1.authenticate, (0, Auth_middleware_1.restrictTo)(['SUPER_ADMIN', 'ADMIN']), InviteCode_controller_1.createInviteCode);
inviteCodeRouter.get('/', Auth_middleware_1.authenticate, (0, Auth_middleware_1.restrictTo)(['SUPER_ADMIN', 'ADMIN']), InviteCode_controller_1.getAllInviteCodes);
// SUPER_ADMIN only route
inviteCodeRouter.delete('/:id', Auth_middleware_1.authenticate, (0, Auth_middleware_1.restrictTo)(['SUPER_ADMIN']), InviteCode_controller_1.deleteInviteCode);
exports.default = inviteCodeRouter;
