const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');
const Notification = require('../models/Notification');
const User = require('../models/User');

class NotificationService {
    constructor() {
        this.transporter = null;
        this.initializeTransporter();
    }

    initializeTransporter() {
        try {
            this.transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST || 'smtp.gmail.com',
                port: parseInt(process.env.SMTP_PORT) || 587,
                secure: process.env.SMTP_SECURE === 'true',
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                }
            });
        } catch (error) {
            console.error('Failed to initialize email transporter:', error);
        }
    }

    async loadEmailTemplate(templateName) {
        try {
            const templatePath = path.join(__dirname, '..', 'templates', 'emails', `${templateName}.html`);
            const template = await fs.readFile(templatePath, 'utf8');
            return template;
        } catch (error) {
            console.error(`Failed to load email template ${templateName}:`, error);
            return null;
        }
    }

    replacePlaceholders(template, data) {
        let result = template;
        for (const [key, value] of Object.entries(data)) {
            const placeholder = new RegExp(`{{${key}}}`, 'g');
            result = result.replace(placeholder, value || '');
        }
        return result;
    }

    async sendEmail(to, subject, templateName, data) {
        if (!this.transporter) {
            console.warn('Email transporter not configured. Skipping email send.');
            return false;
        }

        try {
            const template = await this.loadEmailTemplate(templateName);
            if (!template) {
                console.error(`Email template ${templateName} not found`);
                return false;
            }

            const html = this.replacePlaceholders(template, data);

            const mailOptions = {
                from: `${process.env.EMAIL_FROM_NAME || 'Acero CMS'} <${process.env.EMAIL_FROM || 'noreply@acero.com'}>`,
                to,
                subject,
                html
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log('Email sent successfully:', info.messageId);
            return true;
        } catch (error) {
            console.error('Failed to send email:', error);
            return false;
        }
    }

    async createInAppNotification(userId, type, data) {
        try {
            const notification = await Notification.createNotification({
                userId,
                type,
                title: data.title,
                message: data.message,
                icon: data.icon || this.getIconForType(type),
                resource: data.resource,
                resourceId: data.resourceId,
                metadata: data.metadata || {}
            });
            return notification;
        } catch (error) {
            console.error('Failed to create in-app notification:', error);
            return null;
        }
    }

    getIconForType(type) {
        const iconMap = {
            workflow_submitted: 'send',
            workflow_reviewed: 'eye',
            workflow_approved: 'check-circle',
            workflow_rejected: 'x-circle',
            workflow_published: 'globe',
            workflow_changes_requested: 'edit',
            workflow_archived: 'archive',
            workflow_restored: 'refresh-cw',
            workflow_unpublished: 'eye-off'
        };
        return iconMap[type] || 'bell';
    }

    async notifyWorkflowSubmit(resource, resourceId, resourceTitle, submitter, reviewerIds) {
        try {
            // Get reviewer users
            const reviewers = await User.find({
                _id: { $in: reviewerIds }
            }).select('email firstName lastName');

            const adminPanelUrl = process.env.ADMIN_PANEL_URL || 'http://localhost:5173';
            const resourceUrl = `${adminPanelUrl}/${resource}s/${resourceId}`;

            // Create notifications for each reviewer
            for (const reviewer of reviewers) {
                // In-app notification
                await this.createInAppNotification(reviewer._id, 'workflow_submitted', {
                    title: 'Content Submitted for Review',
                    message: `${submitter.firstName} ${submitter.lastName} submitted "${resourceTitle}" for review`,
                    resource,
                    resourceId,
                    metadata: {
                        submitterId: submitter._id,
                        submitterName: `${submitter.firstName} ${submitter.lastName}`,
                        resourceTitle
                    }
                });

                // Email notification
                await this.sendEmail(
                    reviewer.email,
                    `Content Submitted for Review: ${resourceTitle}`,
                    'workflow-submitted',
                    {
                        reviewerName: reviewer.firstName,
                        submitterName: `${submitter.firstName} ${submitter.lastName}`,
                        resourceType: resource,
                        resourceTitle,
                        resourceUrl,
                        adminPanelUrl
                    }
                );
            }

            return true;
        } catch (error) {
            console.error('Failed to send workflow submit notifications:', error);
            return false;
        }
    }

    async notifyWorkflowReviewed(resource, resourceId, resourceTitle, reviewer, editorId) {
        try {
            const editor = await User.findById(editorId).select('email firstName lastName');
            if (!editor) return false;

            const adminPanelUrl = process.env.ADMIN_PANEL_URL || 'http://localhost:5173';
            const resourceUrl = `${adminPanelUrl}/${resource}s/${resourceId}`;

            // In-app notification
            await this.createInAppNotification(editor._id, 'workflow_reviewed', {
                title: 'Content Reviewed',
                message: `${reviewer.firstName} ${reviewer.lastName} reviewed "${resourceTitle}" and marked it ready for approval`,
                resource,
                resourceId,
                metadata: {
                    reviewerId: reviewer._id,
                    reviewerName: `${reviewer.firstName} ${reviewer.lastName}`,
                    resourceTitle
                }
            });

            // Email notification
            await this.sendEmail(
                editor.email,
                `Content Reviewed: ${resourceTitle}`,
                'workflow-reviewed',
                {
                    editorName: editor.firstName,
                    reviewerName: `${reviewer.firstName} ${reviewer.lastName}`,
                    resourceType: resource,
                    resourceTitle,
                    resourceUrl,
                    adminPanelUrl
                }
            );

            return true;
        } catch (error) {
            console.error('Failed to send workflow reviewed notifications:', error);
            return false;
        }
    }

    async notifyWorkflowApproved(resource, resourceId, resourceTitle, approver, editorId) {
        try {
            const editor = await User.findById(editorId).select('email firstName lastName');
            if (!editor) return false;

            const adminPanelUrl = process.env.ADMIN_PANEL_URL || 'http://localhost:5173';
            const resourceUrl = `${adminPanelUrl}/${resource}s/${resourceId}`;

            // In-app notification for editor
            await this.createInAppNotification(editor._id, 'workflow_approved', {
                title: 'Content Approved',
                message: `${approver.firstName} ${approver.lastName} approved "${resourceTitle}" - ready for publishing`,
                resource,
                resourceId,
                metadata: {
                    approverId: approver._id,
                    approverName: `${approver.firstName} ${approver.lastName}`,
                    resourceTitle
                }
            });

            // Email notification for editor
            await this.sendEmail(
                editor.email,
                `Content Approved: ${resourceTitle}`,
                'workflow-approved',
                {
                    editorName: editor.firstName,
                    approverName: `${approver.firstName} ${approver.lastName}`,
                    resourceType: resource,
                    resourceTitle,
                    resourceUrl,
                    adminPanelUrl
                }
            );

            // Notify admins as well
            const admins = await User.find({ role: 'admin' }).select('email firstName lastName');
            for (const admin of admins) {
                await this.createInAppNotification(admin._id, 'workflow_approved', {
                    title: 'Content Ready to Publish',
                    message: `"${resourceTitle}" has been approved and is ready for publishing`,
                    resource,
                    resourceId,
                    metadata: {
                        approverId: approver._id,
                        approverName: `${approver.firstName} ${approver.lastName}`,
                        resourceTitle
                    }
                });
            }

            return true;
        } catch (error) {
            console.error('Failed to send workflow approved notifications:', error);
            return false;
        }
    }

    async notifyWorkflowRejected(resource, resourceId, resourceTitle, approver, editorId, feedback) {
        try {
            const editor = await User.findById(editorId).select('email firstName lastName');
            if (!editor) return false;

            const adminPanelUrl = process.env.ADMIN_PANEL_URL || 'http://localhost:5173';
            const resourceUrl = `${adminPanelUrl}/${resource}s/${resourceId}`;

            // In-app notification
            await this.createInAppNotification(editor._id, 'workflow_rejected', {
                title: 'Changes Requested',
                message: `${approver.firstName} ${approver.lastName} requested changes to "${resourceTitle}"`,
                resource,
                resourceId,
                metadata: {
                    approverId: approver._id,
                    approverName: `${approver.firstName} ${approver.lastName}`,
                    resourceTitle,
                    feedback
                }
            });

            // Email notification
            await this.sendEmail(
                editor.email,
                `Changes Requested: ${resourceTitle}`,
                'workflow-rejected',
                {
                    editorName: editor.firstName,
                    approverName: `${approver.firstName} ${approver.lastName}`,
                    resourceType: resource,
                    resourceTitle,
                    feedback: feedback || 'No specific feedback provided',
                    resourceUrl,
                    adminPanelUrl
                }
            );

            return true;
        } catch (error) {
            console.error('Failed to send workflow rejected notifications:', error);
            return false;
        }
    }

    async notifyWorkflowChangesRequested(resource, resourceId, resourceTitle, reviewer, editorId, feedback) {
        try {
            const editor = await User.findById(editorId).select('email firstName lastName');
            if (!editor) return false;

            const adminPanelUrl = process.env.ADMIN_PANEL_URL || 'http://localhost:5173';
            const resourceUrl = `${adminPanelUrl}/${resource}s/${resourceId}`;

            // In-app notification
            await this.createInAppNotification(editor._id, 'workflow_changes_requested', {
                title: 'Changes Requested',
                message: `${reviewer.firstName} ${reviewer.lastName} requested changes to "${resourceTitle}"`,
                resource,
                resourceId,
                metadata: {
                    reviewerId: reviewer._id,
                    reviewerName: `${reviewer.firstName} ${reviewer.lastName}`,
                    resourceTitle,
                    feedback
                }
            });

            // Email notification
            await this.sendEmail(
                editor.email,
                `Changes Requested: ${resourceTitle}`,
                'workflow-changes-requested',
                {
                    editorName: editor.firstName,
                    reviewerName: `${reviewer.firstName} ${reviewer.lastName}`,
                    resourceType: resource,
                    resourceTitle,
                    feedback: feedback || 'No specific feedback provided',
                    resourceUrl,
                    adminPanelUrl
                }
            );

            return true;
        } catch (error) {
            console.error('Failed to send workflow changes requested notifications:', error);
            return false;
        }
    }

    async notifyWorkflowPublished(resource, resourceId, resourceTitle, publisher, contributorIds) {
        try {
            const contributors = await User.find({
                _id: { $in: contributorIds }
            }).select('email firstName lastName');

            const publicSiteUrl = process.env.PUBLIC_SITE_URL || 'http://localhost:5174';

            for (const contributor of contributors) {
                // In-app notification
                await this.createInAppNotification(contributor._id, 'workflow_published', {
                    title: 'Content Published',
                    message: `"${resourceTitle}" has been published by ${publisher.firstName} ${publisher.lastName}`,
                    resource,
                    resourceId,
                    metadata: {
                        publisherId: publisher._id,
                        publisherName: `${publisher.firstName} ${publisher.lastName}`,
                        resourceTitle
                    }
                });

                // Email notification
                await this.sendEmail(
                    contributor.email,
                    `Content Published: ${resourceTitle}`,
                    'workflow-published',
                    {
                        contributorName: contributor.firstName,
                        publisherName: `${publisher.firstName} ${publisher.lastName}`,
                        resourceType: resource,
                        resourceTitle,
                        publicSiteUrl
                    }
                );
            }

            return true;
        } catch (error) {
            console.error('Failed to send workflow published notifications:', error);
            return false;
        }
    }
}

// Export singleton instance
module.exports = new NotificationService();

