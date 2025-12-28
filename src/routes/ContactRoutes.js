"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Auth_middleware_1 = require("../middleware/Auth.middleware");
const Contacts_controllers_1 = require("../controllers/Contacts.controllers");
const contactRouter = (0, express_1.Router)();
// Public route - anyone can submit
contactRouter.post('/', Contacts_controllers_1.submitContactForm);
// Protected routes - admin only
contactRouter.use(Auth_middleware_1.authenticate, (0, Auth_middleware_1.restrictTo)(['ADMIN', 'SUPER_ADMIN']));
// Reply Clients From Dashboard
contactRouter.post('/:id/reply', Auth_middleware_1.authenticate, (0, Auth_middleware_1.restrictTo)(['ADMIN', 'SUPER_ADMIN']), Contacts_controllers_1.replyToContact);
contactRouter.get('/', Contacts_controllers_1.getContactMessages);
contactRouter.get('/:id', Contacts_controllers_1.getContactMessageById);
contactRouter.patch('/:id', Contacts_controllers_1.updateContactMessageStatus);
contactRouter.delete('/:id', Contacts_controllers_1.deleteContactMessage);
exports.default = contactRouter;
