"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const pool = require('../config/db');
require('dotenv').config();
const router = express_1.default.Router();
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
    const user = result.rows[0];
    if (!user)
        return res.status(401).json({ error: 'invalid credentials' });
    const ok = await bcrypt_1.default.compare(password, user.password);
    if (!ok)
        return res.status(401).json({ error: 'invalid credentials' });
    const token = jsonwebtoken_1.default.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '15m' });
    res.json({ token });
});
exports.default = router;
