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
router.post('/signup', async (req, res) => {
    const { email, password, role } = req.body;
    if (!email || !password)
        return res.status(400).json({ error: 'email/password required' });
    const hashed = await bcrypt_1.default.hash(password, 10);
    const result = await pool.query('INSERT INTO users(email, password, role) VALUES($1, $2, $3) RETURNING id, email, role', [email, hashed, role || 'student']);
    const user = result.rows[0];
    const token = jsonwebtoken_1.default.sign({ userId: user.id, role: user.role, email: user.email }, process.env.JWT_SECRET, { expiresIn: '15m' });
    res.json({ token, user });
});
exports.default = router;
