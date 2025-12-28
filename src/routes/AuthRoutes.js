"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Auth_Controller_1 = require("../controllers/Auth.Controller");
const router = (0, express_1.Router)();
// Public routes
router.post('/signup', Auth_Controller_1.signup);
router.post('/login', Auth_Controller_1.login);
router.post('/verify-invite', Auth_Controller_1.verifyInviteCode);
exports.default = router;
