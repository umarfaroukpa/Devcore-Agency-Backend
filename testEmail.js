"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const emailservices_1 = require("./src/utils/emailservices");
exports.router = (0, express_1.Router)();
exports.router.get('/test-email', async (req, res) => {
    try {
        await (0, emailservices_1.sendEmail)('yasmarfaq51@gmail.com', 'approval', {
            user: { firstName: 'Test', role: 'DEVELOPER' }
        });
        res.json({ success: true, message: 'Email sent!' });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
