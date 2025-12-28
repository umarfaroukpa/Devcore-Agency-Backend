"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateService = exports.createService = exports.getPublicServices = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
// Public: Get list of services offered
const getPublicServices = async (req, res) => {
    // Note: You must create a 'Service' model in your schema.prisma first!
    try {
        const services = await prisma_1.default.service.findMany({
            where: { isActive: true }, // Only show active services to the public
            select: { id: true, title: true, description: true }
        });
        return res.status(200).json({ data: services });
    }
    catch (error) {
        console.error('Error fetching services:', error);
        return res.status(500).json({ error: 'Server error fetching services.' });
    }
};
exports.getPublicServices = getPublicServices;
// Protected: Create a new service (Admin/Manager)
const createService = async (req, res) => {
    // Logic to save a new service to the database
    return res.status(501).json({ message: 'Create Service Not Implemented.' });
};
exports.createService = createService;
// Protected: Update an existing service (Admin/Manager)
const updateService = async (req, res) => {
    // Logic to update service details
    return res.status(501).json({ message: 'Update Service Not Implemented.' });
};
exports.updateService = updateService;
