const nodemailer = require('nodemailer');
const SMTPSettings = require('../models/SMTPSettings');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const { canEditContent, canDeleteContent } = require('../utils/workflowStatusValidator');

// List with filters/pagination
exports.getAllSMTPSettings = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            status,
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        const query = { isActive: true };
        if (status) query.status = status;
        if (search) {
            query.$or = [
                { title: new RegExp(search, 'i') },
                { 'fromEmail.value': new RegExp(search, 'i') }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

        const [items, total] = await Promise.all([
            SMTPSettings.find(query)
                .populate('createdBy', 'firstName lastName email')
                .populate('updatedBy', 'firstName lastName email')
                .sort(sortOptions)
                .skip(skip)
                .limit(parseInt(limit)),
            SMTPSettings.countDocuments(query)
        ]);

        return successResponse(res, 200, 'SMTP settings retrieved successfully', {
            smtpSettings: items,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error in getAllSMTPSettings:', error);
        return errorResponse(res, 500, 'Failed to retrieve SMTP settings', error.message);
    }
};

// Get by id
exports.getSMTPSettingsById = async (req, res) => {
    try {
        const { id } = req.params;
        const item = await SMTPSettings.findOne({ _id: id, isActive: true })
            .populate('createdBy', 'firstName lastName email')
            .populate('updatedBy', 'firstName lastName email');

        if (!item) {
            return errorResponse(res, 404, 'SMTP settings not found');
        }

        return successResponse(res, 200, 'SMTP settings retrieved successfully', { smtpSettings: item });
    } catch (error) {
        console.error('Error in getSMTPSettingsById:', error);
        return errorResponse(res, 500, 'Failed to retrieve SMTP settings', error.message);
    }
};

// Create
exports.createSMTPSettings = async (req, res) => {
    try {
        const data = { ...req.body, createdBy: req.user._id };
        const item = new SMTPSettings(data);
        await item.save();

        const populated = await SMTPSettings.findById(item._id)
            .populate('createdBy', 'firstName lastName email');

        return successResponse(res, 201, 'SMTP settings created successfully', { smtpSettings: populated });
    } catch (error) {
        console.error('Error in createSMTPSettings:', error);
        if (error.name === 'ValidationError') {
            return errorResponse(res, 400, 'Validation error', error.message);
        }
        return errorResponse(res, 500, 'Failed to create SMTP settings', error.message);
    }
};

// Update
exports.updateSMTPSettings = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const item = await SMTPSettings.findOne({ _id: id, isActive: true });
        if (!item) {
            return errorResponse(res, 404, 'SMTP settings not found');
        }

        const isOnlyStatusUpdate = Object.keys(updateData).length === 1 && Object.prototype.hasOwnProperty.call(updateData, 'status');
        const editValidation = await canEditContent(req.user, item, 'smtp-settings', 'update');
        if (!editValidation.canEdit) {
            return errorResponse(res, 403, editValidation.reason || 'You do not have permission to edit these SMTP settings');
        }

        if (item.status === 'published' && !isOnlyStatusUpdate) {
            return errorResponse(res, 400, 'Cannot edit published content. Please unpublish first or use workflow actions.');
        }

        Object.keys(updateData).forEach(key => {
            if (updateData[key] !== undefined && key !== '_id' && key !== 'createdBy') {
                item[key] = updateData[key];
            }
        });

        item.updatedBy = req.user._id;
        await item.save();

        const updated = await SMTPSettings.findById(item._id)
            .populate('createdBy', 'firstName lastName email')
            .populate('updatedBy', 'firstName lastName email');

        return successResponse(res, 200, 'SMTP settings updated successfully', { smtpSettings: updated });
    } catch (error) {
        console.error('Error in updateSMTPSettings:', error);
        if (error.name === 'ValidationError') {
            return errorResponse(res, 400, 'Validation error', error.message);
        }
        return errorResponse(res, 500, 'Failed to update SMTP settings', error.message);
    }
};

// Delete (soft)
exports.deleteSMTPSettings = async (req, res) => {
    try {
        const { id } = req.params;
        const item = await SMTPSettings.findOne({ _id: id, isActive: true });
        if (!item) {
            return errorResponse(res, 404, 'SMTP settings not found');
        }

        const deleteValidation = await canDeleteContent(req.user, item, 'smtp-settings');
        if (!deleteValidation.canDelete) {
            return errorResponse(res, 403, deleteValidation.reason || 'You do not have permission to delete these SMTP settings');
        }

        item.isActive = false;
        item.updatedBy = req.user._id;
        await item.save();

        return successResponse(res, 200, 'SMTP settings deleted successfully', { smtpSettings: { _id: item._id, isActive: false } });
    } catch (error) {
        console.error('Error in deleteSMTPSettings:', error);
        return errorResponse(res, 500, 'Failed to delete SMTP settings', error.message);
    }
};



exports.sendSMTPTestEmail = async (req, res) => {
    try {
        const { id } = req.params;
        const { email } = req.body || {};

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim())) {
            return errorResponse(res, 400, 'Please provide a valid test email address');
        }

        const item = await SMTPSettings.findOne({ _id: id, isActive: true });
        if (!item) {
            return errorResponse(res, 404, 'SMTP settings not found');
        }

        if (!item.host?.value || !item.port?.value || !item.username?.value || !item.password?.value) {
            return errorResponse(res, 400, 'SMTP host, port, username, and password are required before sending a test email');
        }

        const transporter = nodemailer.createTransport({
            host: item.host.value,
            port: Number(item.port.value),
            secure: !!item.secure?.value,
            auth: {
                user: item.username.value,
                pass: item.password.value
            }
        });

        await transporter.verify();

        const fromEmail = item.fromEmail?.value || item.username.value;
        const fromName = item.fromName?.value || item.title || 'Acero CMS';
        const to = String(email).trim();
        const sentAt = new Date().toISOString().replace('T', ' ').slice(0, 16);

        const info = await transporter.sendMail({
            from: `${fromName} <${fromEmail}>`,
            to,
            subject: 'Acero SMTP Test Email',
            html: `
                <div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;border:1px solid #e5e7eb;">
                    <div style="background:#b81725;color:#fff;padding:22px 26px;">
                        <div style="font-size:28px;font-weight:700;letter-spacing:.5px;">ACERO</div>
                        <div style="font-size:16px;margin-top:6px;">SMTP Test Email</div>
                    </div>
                    <div style="padding:26px;color:#1f2937;font-size:15px;line-height:1.6;">
                        <p style="margin:0 0 14px;">This is a test email from Acero CMS SMTP settings.</p>
                        <p style="margin:0 0 14px;">If you received this email, the selected SMTP configuration is able to send mail successfully.</p>
                        <p style="margin:0;"><strong>Sent at:</strong> ${sentAt} UTC</p>
                    </div>
                    <div style="background:#1f2937;color:#fff;padding:14px 26px;font-size:12px;">
                        Copyright (c) 2026 Acero Building Systems. All rights reserved.
                    </div>
                </div>
            `
        });

        return successResponse(res, 200, 'Test email sent successfully', {
            messageId: info.messageId,
            accepted: info.accepted || []
        });
    } catch (error) {
        console.error('Error in sendSMTPTestEmail:', error);
        return errorResponse(res, 500, `Failed to send test email: ${error.message}`);
    }
};