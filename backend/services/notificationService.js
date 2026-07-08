const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');
const Notification = require('../models/Notification');
const User = require('../models/User');
const FormConfiguration = require('../models/FormConfiguration');
const Vacancy = require('../models/Vacancy');
const SMTPSettings = require('../models/SMTPSettings');
const { getAdminPanelUrl, getPublicSiteUrl } = require('../utils/urlHelper');

const SMTP_CACHE_TTL_MS = 60000;

function escapeEmailHtml(value = '') {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function formatEmailDate(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString().replace('T', ' ').slice(0, 16);
}

class NotificationService {
    constructor() {
        this.transporter = null;
        this._smtpCache = null;
        this._smtpCacheExpiry = 0;
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

    async getTransporterAndFrom() {
        const now = Date.now();
        if (this._smtpCache && this._smtpCacheExpiry > now) {
            return this._smtpCache;
        }
        try {
            const published = await SMTPSettings.getPublished();
            if (published && published.host?.value && published.port?.value != null && published.username?.value && published.password?.value) {
                const transport = nodemailer.createTransport({
                    host: published.host.value,
                    port: Number(published.port.value),
                    secure: !!published.secure?.value,
                    auth: {
                        user: published.username.value,
                        pass: published.password.value
                    }
                });
                const fromEmail = published.fromEmail?.value || process.env.EMAIL_FROM || 'noreply@acero.com';
                const fromName = published.fromName?.value || process.env.EMAIL_FROM_NAME || 'Acero CMS';
                const from = `${fromName} <${fromEmail}>`;
                const result = { transport, from };
                this._smtpCache = result;
                this._smtpCacheExpiry = now + SMTP_CACHE_TTL_MS;
                return result;
            }
        } catch (err) {
            console.error('Failed to load published SMTP config, using env fallback:', err.message);
        }
        this._smtpCache = null;
        if (!this.transporter) {
            this.initializeTransporter();
        }
        const from = `${process.env.EMAIL_FROM_NAME || 'Acero CMS'} <${process.env.EMAIL_FROM || 'noreply@acero.com'}>`;
        return { transport: this.transporter, from };
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
        const { transport, from } = await this.getTransporterAndFrom();
        if (!transport) {
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
                from: from || `${process.env.EMAIL_FROM_NAME || 'Acero CMS'} <${process.env.EMAIL_FROM || 'noreply@acero.com'}>`,
                to,
                subject,
                html
            };

            const info = await transport.sendMail(mailOptions);
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

    async notifyWorkflowSubmit(resource, resourceId, resourceTitle, submitter, reviewerIds, changeSummary = null) {
        try {
            // Get reviewer users
            const reviewers = await User.find({
                _id: { $in: reviewerIds }
            }).select('email firstName lastName');

            const adminPanelUrl = getAdminPanelUrl();
            const resourceUrl = `${adminPanelUrl}/${resource}s/${resourceId}`;

            // Build message with change summary if provided
            const baseMessage = `${submitter.firstName} ${submitter.lastName} submitted "${resourceTitle}" for review`;
            const messageWithSummary = changeSummary 
                ? `${baseMessage}\n\nChange Summary: ${changeSummary}`
                : baseMessage;

            // Create notifications for each reviewer
            for (const reviewer of reviewers) {
                // In-app notification
                await this.createInAppNotification(reviewer._id, 'workflow_submitted', {
                    title: 'Content Submitted for Review',
                    message: messageWithSummary,
                    resource,
                    resourceId,
                    metadata: {
                        submitterId: submitter._id,
                        submitterName: `${submitter.firstName} ${submitter.lastName}`,
                        resourceTitle,
                        changeSummary: changeSummary || null
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
                        adminPanelUrl,
                        changeSummary: changeSummary || 'No change summary provided'
                    }
                );
            }

            return true;
        } catch (error) {
            console.error('Failed to send workflow submit notifications:', error);
            return false;
        }
    }

    async notifyWorkflowReviewed(resource, resourceId, resourceTitle, reviewer, editorId, changeSummary = null) {
        try {
            const editor = await User.findById(editorId).select('email firstName lastName');
            if (!editor) return false;

            const adminPanelUrl = getAdminPanelUrl();
            const resourceUrl = `${adminPanelUrl}/${resource}s/${resourceId}`;

            // Build message with change summary if provided
            const baseMessage = `${reviewer.firstName} ${reviewer.lastName} reviewed "${resourceTitle}" and marked it ready for approval`;
            const messageWithSummary = changeSummary 
                ? `${baseMessage}\n\nChange Summary: ${changeSummary}`
                : baseMessage;

            // In-app notification
            await this.createInAppNotification(editor._id, 'workflow_reviewed', {
                title: 'Content Reviewed',
                message: messageWithSummary,
                resource,
                resourceId,
                metadata: {
                    reviewerId: reviewer._id,
                    reviewerName: `${reviewer.firstName} ${reviewer.lastName}`,
                    resourceTitle,
                    changeSummary: changeSummary || null
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
                    adminPanelUrl,
                    changeSummary: changeSummary || 'No change summary provided'
                }
            );

            return true;
        } catch (error) {
            console.error('Failed to send workflow reviewed notifications:', error);
            return false;
        }
    }

    async notifyWorkflowApproved(resource, resourceId, resourceTitle, approver, editorId, changeSummary = null) {
        try {
            const editor = await User.findById(editorId).select('email firstName lastName');
            if (!editor) return false;

            const adminPanelUrl = getAdminPanelUrl();
            const resourceUrl = `${adminPanelUrl}/${resource}s/${resourceId}`;

            // Build message with change summary if provided
            const baseMessage = `${approver.firstName} ${approver.lastName} approved "${resourceTitle}" - ready for publishing`;
            const messageWithSummary = changeSummary 
                ? `${baseMessage}\n\nChange Summary: ${changeSummary}`
                : baseMessage;

            // In-app notification for editor
            const notification = await this.createInAppNotification(editor._id, 'workflow_approved', {
                title: 'Content Approved',
                message: messageWithSummary,
                resource,
                resourceId,
                metadata: {
                    approverId: approver._id,
                    approverName: `${approver.firstName} ${approver.lastName}`,
                    resourceTitle,
                    changeSummary: changeSummary || null
                }
            });
            
            if (!notification) {
                console.error(`Failed to create approved notification for editor ${editor._id} for resource ${resource} ${resourceId}`);
            } else {
                console.log(`Successfully created approved notification for editor ${editor._id} for resource ${resource} ${resourceId}`);
            }

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
                    adminPanelUrl,
                    changeSummary: changeSummary || 'No change summary provided'
                }
            );

            // Notify reviewers, admins, and super admins as well
            const Role = require('../models/Role');
            const adminRoles = await Role.find({
                slug: { $in: ['reviewer', 'admin', 'super_admin'] }
            }).select('_id');
            
            if (adminRoles.length > 0) {
                const adminRoleIds = adminRoles.map(r => r._id);
                const admins = await User.find({
                    role: { $in: adminRoleIds },
                    isActive: true
                }).select('_id email firstName lastName');
                
                const adminMessage = changeSummary 
                    ? `"${resourceTitle}" has been approved and is ready for publishing\n\nChange Summary: ${changeSummary}`
                    : `"${resourceTitle}" has been approved and is ready for publishing`;
                
                for (const admin of admins) {
                    // Skip if this is the approver themselves
                    if (admin._id.toString() === approver._id.toString()) {
                        continue;
                    }
                    
                    // In-app notification
                    await this.createInAppNotification(admin._id, 'workflow_approved', {
                        title: 'Content Ready to Publish',
                        message: adminMessage,
                        resource,
                        resourceId,
                        metadata: {
                            approverId: approver._id,
                            approverName: `${approver.firstName} ${approver.lastName}`,
                            resourceTitle,
                            changeSummary: changeSummary || null
                        }
                    });
                    
                    // Email notification
                    await this.sendEmail(
                        admin.email,
                        `Content Ready to Publish: ${resourceTitle}`,
                        'workflow-approved',
                        {
                            adminName: admin.firstName,
                            approverName: `${approver.firstName} ${approver.lastName}`,
                            resourceType: resource,
                            resourceTitle,
                            resourceUrl,
                            adminPanelUrl,
                            changeSummary: changeSummary || 'No change summary provided'
                        }
                    );
                }
            }

            return true;
        } catch (error) {
            console.error('Failed to send workflow approved notifications:', error);
            return false;
        }
    }

    async notifyWorkflowRejected(resource, resourceId, resourceTitle, approver, editorId, feedback, changeSummary = null) {
        try {
            const editor = await User.findById(editorId).select('email firstName lastName');
            if (!editor) return false;

            const adminPanelUrl = getAdminPanelUrl();
            const resourceUrl = `${adminPanelUrl}/${resource}s/${resourceId}`;

            // Build message with change summary if provided
            const baseMessage = `${approver.firstName} ${approver.lastName} requested changes to "${resourceTitle}"`;
            let messageWithSummary = baseMessage;
            if (changeSummary) {
                messageWithSummary += `\n\nChange Summary: ${changeSummary}`;
            }
            if (feedback) {
                messageWithSummary += `\n\nFeedback: ${feedback}`;
            }

            // In-app notification
            await this.createInAppNotification(editor._id, 'workflow_rejected', {
                title: 'Changes Requested',
                message: messageWithSummary,
                resource,
                resourceId,
                metadata: {
                    approverId: approver._id,
                    approverName: `${approver.firstName} ${approver.lastName}`,
                    resourceTitle,
                    feedback,
                    changeSummary: changeSummary || null
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
                    changeSummary: changeSummary || 'No change summary provided',
                    resourceUrl,
                    adminPanelUrl
                }
            );

            // Notify reviewers, admins, and super admins as well
            const Role = require('../models/Role');
            const adminRoles = await Role.find({
                slug: { $in: ['reviewer', 'admin', 'super_admin'] }
            }).select('_id');
            
            if (adminRoles.length > 0) {
                const adminRoleIds = adminRoles.map(r => r._id);
                const admins = await User.find({
                    role: { $in: adminRoleIds },
                    isActive: true
                }).select('_id email firstName lastName');
                
                let adminMessage = feedback
                    ? `"${resourceTitle}" has been rejected and changes were requested\n\nFeedback: ${feedback}`
                    : `"${resourceTitle}" has been rejected and changes were requested`;
                
                if (changeSummary) {
                    adminMessage += `\n\nChange Summary: ${changeSummary}`;
                }
                
                for (const admin of admins) {
                    // Skip if this is the approver themselves
                    if (admin._id.toString() === approver._id.toString()) {
                        continue;
                    }
                    
                    // In-app notification
                    await this.createInAppNotification(admin._id, 'workflow_rejected', {
                        title: 'Content Rejected',
                        message: adminMessage,
                        resource,
                        resourceId,
                        metadata: {
                            approverId: approver._id,
                            approverName: `${approver.firstName} ${approver.lastName}`,
                            resourceTitle,
                            feedback,
                            changeSummary: changeSummary || null
                        }
                    });
                    
                    // Email notification
                    await this.sendEmail(
                        admin.email,
                        `Content Rejected: ${resourceTitle}`,
                        'workflow-rejected',
                        {
                            adminName: admin.firstName,
                            approverName: `${approver.firstName} ${approver.lastName}`,
                            resourceType: resource,
                            resourceTitle,
                            feedback: feedback || 'No specific feedback provided',
                            changeSummary: changeSummary || 'No change summary provided',
                            resourceUrl,
                            adminPanelUrl
                        }
                    );
                }
            }

            return true;
        } catch (error) {
            console.error('Failed to send workflow rejected notifications:', error);
            return false;
        }
    }

    async notifyWorkflowChangesRequested(resource, resourceId, resourceTitle, reviewer, editorId, feedback, changeSummary = null) {
        try {
            const editor = await User.findById(editorId).select('email firstName lastName');
            if (!editor) return false;

            const adminPanelUrl = getAdminPanelUrl();
            const resourceUrl = `${adminPanelUrl}/${resource}s/${resourceId}`;

            // Build message with change summary if provided
            const baseMessage = `${reviewer.firstName} ${reviewer.lastName} requested changes to "${resourceTitle}"`;
            let messageWithSummary = baseMessage;
            if (changeSummary) {
                messageWithSummary += `\n\nChange Summary: ${changeSummary}`;
            }
            if (feedback) {
                messageWithSummary += `\n\nFeedback: ${feedback}`;
            }

            // In-app notification
            await this.createInAppNotification(editor._id, 'workflow_changes_requested', {
                title: 'Changes Requested',
                message: messageWithSummary,
                resource,
                resourceId,
                metadata: {
                    reviewerId: reviewer._id,
                    reviewerName: `${reviewer.firstName} ${reviewer.lastName}`,
                    resourceTitle,
                    feedback,
                    changeSummary: changeSummary || null
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
                    changeSummary: changeSummary || 'No change summary provided',
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

    async notifyWorkflowPendingApproval(resource, resourceId, resourceTitle, reviewer, approverIds, changeSummary = null) {
        try {
            // Get approver users
            const approvers = await User.find({
                _id: { $in: approverIds }
            }).select('email firstName lastName');

            const adminPanelUrl = getAdminPanelUrl();
            const resourceUrl = `${adminPanelUrl}/${resource}s/${resourceId}`;

            // Build message with change summary if provided
            const baseMessage = `${reviewer.firstName} ${reviewer.lastName} reviewed "${resourceTitle}" - ready for approval`;
            const messageWithSummary = changeSummary 
                ? `${baseMessage}\n\nChange Summary: ${changeSummary}`
                : baseMessage;

            // Create notifications for each approver
            for (const approver of approvers) {
                // In-app notification
                await this.createInAppNotification(approver._id, 'workflow_reviewed', {
                    title: 'Content Ready for Approval',
                    message: messageWithSummary,
                    resource,
                    resourceId,
                    metadata: {
                        reviewerId: reviewer._id,
                        reviewerName: `${reviewer.firstName} ${reviewer.lastName}`,
                        resourceTitle,
                        changeSummary: changeSummary || null
                    }
                });

                // Email notification
                await this.sendEmail(
                    approver.email,
                    `Content Ready for Approval: ${resourceTitle}`,
                    'workflow-reviewed',
                    {
                        approverName: approver.firstName,
                        reviewerName: `${reviewer.firstName} ${reviewer.lastName}`,
                        resourceType: resource,
                        resourceTitle,
                        resourceUrl,
                        adminPanelUrl,
                        changeSummary: changeSummary || 'No change summary provided'
                    }
                );
            }

            return true;
        } catch (error) {
            console.error('Failed to send workflow pending approval notifications:', error);
            return false;
        }
    }

    async notifyWorkflowPublished(resource, resourceId, resourceTitle, publisher, contributorIds, changeSummary = null) {
        try {
            const contributors = await User.find({
                _id: { $in: contributorIds }
            }).select('email firstName lastName');

            const publicSiteUrl = getPublicSiteUrl();

            // Build message with change summary if provided
            const baseMessage = `"${resourceTitle}" has been published by ${publisher.firstName} ${publisher.lastName}`;
            const messageWithSummary = changeSummary 
                ? `${baseMessage}\n\nChange Summary: ${changeSummary}`
                : baseMessage;

            for (const contributor of contributors) {
                // In-app notification
                const notification = await this.createInAppNotification(contributor._id, 'workflow_published', {
                    title: 'Content Published',
                    message: messageWithSummary,
                    resource,
                    resourceId,
                    metadata: {
                        publisherId: publisher._id,
                        publisherName: `${publisher.firstName} ${publisher.lastName}`,
                        resourceTitle,
                        changeSummary: changeSummary || null
                    }
                });
                
                if (!notification) {
                    console.error(`Failed to create published notification for contributor ${contributor._id} for resource ${resource} ${resourceId}`);
                } else {
                    console.log(`Successfully created published notification for contributor ${contributor._id} for resource ${resource} ${resourceId}`);
                }

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
                        changeSummary: changeSummary || 'No change summary provided',
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

    async notifyWorkflowPublishedToAdmins(resource, resourceId, resourceTitle, publisher, adminIds, changeSummary = null) {
        try {
            // Get admin users (reviewers, admins, super admins)
            const admins = await User.find({
                _id: { $in: adminIds }
            }).select('email firstName lastName');

            const adminPanelUrl = getAdminPanelUrl();
            const resourceUrl = `${adminPanelUrl}/${resource}s/${resourceId}`;
            const publicSiteUrl = getPublicSiteUrl();

            // Build message with change summary if provided
            const baseMessage = `"${resourceTitle}" has been published by ${publisher.firstName} ${publisher.lastName}`;
            const messageWithSummary = changeSummary 
                ? `${baseMessage}\n\nChange Summary: ${changeSummary}`
                : baseMessage;

            for (const admin of admins) {
                // Skip if this is the publisher themselves
                if (admin._id.toString() === publisher._id.toString()) {
                    continue;
                }

                // In-app notification
                await this.createInAppNotification(admin._id, 'workflow_published', {
                    title: 'Content Published',
                    message: messageWithSummary,
                    resource,
                    resourceId,
                    metadata: {
                        publisherId: publisher._id,
                        publisherName: `${publisher.firstName} ${publisher.lastName}`,
                        resourceTitle,
                        changeSummary: changeSummary || null
                    }
                });

                // Email notification
                await this.sendEmail(
                    admin.email,
                    `Content Published: ${resourceTitle}`,
                    'workflow-published',
                    {
                        adminName: admin.firstName,
                        publisherName: `${publisher.firstName} ${publisher.lastName}`,
                        resourceType: resource,
                        resourceTitle,
                        resourceUrl,
                        adminPanelUrl,
                        changeSummary: changeSummary || 'No change summary provided',
                        publicSiteUrl
                    }
                );
            }

            return true;
        } catch (error) {
            console.error('Failed to send workflow published notifications to admins:', error);
            return false;
        }
    }

    /**
     * Notify on enquiry submission
     * @param {Object} enquiry - Enquiry document
     */
    async notifyEnquirySubmission(enquiry) {
        try {
            const activeConfig = await FormConfiguration.getActive();
            const toEmail = enquiry.notificationEmail || activeConfig?.defaultEnquiryEmail;

            if (!toEmail) {
                console.warn('No notification email configured for enquiry submission');
                return false;
            }

            const subject = `New Enquiry from ${enquiry.fullName || 'Visitor'}`;
            const templateName = 'enquiry-submitted'; // template should exist

            const data = {
                fullName: escapeEmailHtml(enquiry.fullName || ''),
                email: escapeEmailHtml(enquiry.email || ''),
                mobileNumber: escapeEmailHtml(enquiry.mobileNumber || ''),
                country: escapeEmailHtml(enquiry.country || ''),
                purpose: escapeEmailHtml(enquiry.purpose || ''),
                subject: escapeEmailHtml(enquiry.subject || ''),
                message: escapeEmailHtml(enquiry.message || ''),
                companyName: escapeEmailHtml(enquiry.companyName || ''),
                telephoneNumber: escapeEmailHtml(enquiry.telephoneNumber || ''),
                countryCode: escapeEmailHtml(enquiry.countryCode || ''),
                submittedAt: escapeEmailHtml(formatEmailDate(enquiry.submittedAt))
            };

            return await this.sendEmail(toEmail, subject, templateName, data);
        } catch (error) {
            console.error('Failed to send enquiry submission notification:', error);
            return false;
        }
    }
    async sendEnquiryConfirmation(enquiry) {
        try {
            if (!enquiry?.email) return false;

            const data = {
                fullName: escapeEmailHtml(enquiry.fullName || 'there'),
                subject: escapeEmailHtml(enquiry.subject || ''),
                purpose: escapeEmailHtml(enquiry.purpose || ''),
                submittedAt: escapeEmailHtml(formatEmailDate(enquiry.submittedAt)),
                publicSiteUrl: escapeEmailHtml(getPublicSiteUrl())
            };

            return await this.sendEmail(
                enquiry.email,
                'We received your enquiry - Acero Building Systems',
                'enquiry-confirmation',
                data
            );
        } catch (error) {
            console.error('Failed to send enquiry confirmation email:', error);
            return false;
        }
    }


    /**
     * Notify on application submission
     * @param {Object} application - Application document
     */
    async sendApplicationConfirmation(application) {
        try {
            if (!application?.email) return false;

            const vacancy = await Vacancy.findById(application.vacancyId).lean();
            const fullName = `${application.firstName || ''} ${application.lastName || ''}`.trim() || 'there';
            const data = {
                fullName: escapeEmailHtml(fullName),
                vacancyTitle: escapeEmailHtml(vacancy?.title || 'the selected position'),
                department: escapeEmailHtml(vacancy?.department || ''),
                submittedAt: escapeEmailHtml(formatEmailDate(application.submittedAt)),
                publicSiteUrl: escapeEmailHtml(getPublicSiteUrl())
            };

            return await this.sendEmail(
                application.email,
                'We received your job application - Acero Building Systems',
                'application-confirmation',
                data
            );
        } catch (error) {
            console.error('Failed to send application confirmation email:', error);
            return false;
        }
    }

    async notifyApplicationSubmission(application) {
        try {
            // Find vacancy to get configured email
            const vacancy = await Vacancy.findById(application.vacancyId).lean();
            const activeConfig = await FormConfiguration.getActive();

            const toEmail = (vacancy && vacancy.notificationEmail) || activeConfig?.defaultApplicationEmail;
            console.log('notifyApplicationSubmission: toEmail:', toEmail, 'vacancy:', vacancy, 'activeConfig:', activeConfig);

            if (!toEmail) {
                console.warn('No notification email configured for application submission');
                return false;
            }

            const subject = `New Application: ${application.firstName || ''} ${application.lastName || ''}`;
            const templateName = 'application-submitted'; // template should exist

            const data = {
                fullName: escapeEmailHtml(`${application.firstName || ''} ${application.lastName || ''}`.trim()),
                email: escapeEmailHtml(application.email || ''),
                mobileNumber: escapeEmailHtml(application.mobileNumber || ''),
                country: escapeEmailHtml(application.country || ''),
                experienceLevel: escapeEmailHtml(application.experienceLevel || ''),
                educationLevel: escapeEmailHtml(application.educationLevel || ''),
                hasEngineeringDegree: escapeEmailHtml(application.hasEngineeringDegree || ''),
                languages: escapeEmailHtml(Array.isArray(application.languages) ? application.languages.join(', ') : ''),
                coverLetter: escapeEmailHtml(application.coverLetter || ''),
                vacancyTitle: escapeEmailHtml(vacancy?.title || ''),
                department: escapeEmailHtml(vacancy?.department || ''),
                submittedAt: escapeEmailHtml(formatEmailDate(application.submittedAt)),
                cvUrl: escapeEmailHtml(application.cvFile?.url || '')
            };

            return await this.sendEmail(toEmail, subject, templateName, data);
        } catch (error) {
            console.error('Failed to send application submission notification:', error);
            return false;
        }
    }
}

// Export singleton instance
module.exports = new NotificationService();

