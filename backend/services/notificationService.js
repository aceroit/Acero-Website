const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');
const Notification = require('../models/Notification');
const User = require('../models/User');
const FormConfiguration = require('../models/FormConfiguration');
const Vacancy = require('../models/Vacancy');
const SMTPSettings = require('../models/SMTPSettings');
const FooterConfiguration = require('../models/FooterConfiguration');
const { getAdminPanelUrl, getPublicSiteUrl } = require('../utils/urlHelper');

const SMTP_CACHE_TTL_MS = 60000;
const DEFAULT_EMAIL_SOCIAL_LINKS = [
    { platform: 'Facebook', href: 'https://www.facebook.com/p/Acero-Building-Systems-100086609227894/' },
    { platform: 'YouTube', href: 'https://www.youtube.com/@acerobuildingsystems7602' },
    { platform: 'LinkedIn', href: 'https://ae.linkedin.com/company/acero-building-systems' }
];

// All outbound email templates pass user-entered values through this helper.
// Keep it in place for any future form/workflow templates.
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

    const timeZone = process.env.EMAIL_TIMEZONE || 'Asia/Dubai';
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });

    const parts = formatter.formatToParts(date).reduce((acc, part) => {
        if (part.type !== 'literal') acc[part.type] = part.value;
        return acc;
    }, {});

    return parts.year + '-' + parts.month + '-' + parts.day + ' ' + parts.hour + ':' + parts.minute + ' ' + parts.dayPeriod;
}

function getEmailDisplayValue(value, fallback = 'Not provided') {
    const normalized = String(value || '').trim();
    return normalized || fallback;
}

const EMAIL_COUNTRY_DIAL_CODES = {
    'bahrain': '+973',
    'bangladesh': '+880',
    'egypt': '+20',
    'india': '+91',
    'kuwait': '+965',
    'oman': '+968',
    'pakistan': '+92',
    'philippines': '+63',
    'qatar': '+974',
    'saudi arabia': '+966',
    'united arab emirates': '+971',
    'uae': '+971',
    'united kingdom': '+44',
    'united states': '+1'
};

function getCountryDialCode(country) {
    return EMAIL_COUNTRY_DIAL_CODES[String(country || '').trim().toLowerCase()] || '';
}

function normalizePhoneForComparison(value) {
    return String(value || '').replace(/[^\d+]/g, '');
}

function getMobileNumberDisplay(mobileNumber, countryCode, country) {
    const mobile = getEmailDisplayValue(mobileNumber, '');
    if (!mobile) return 'Not provided';

    const code = getEmailDisplayValue(countryCode || getCountryDialCode(country), '');
    if (!code) return mobile;

    const normalizedMobile = normalizePhoneForComparison(mobile);
    const normalizedCode = normalizePhoneForComparison(code);

    if (normalizedCode && normalizedMobile.startsWith(normalizedCode)) {
        return mobile;
    }

    return code + ' ' + mobile;
}

function getPurposeLabel(value) {
    const labels = {
        general: 'General Inquiry',
        sales: 'Sales / Get Quote',
        support: 'Support',
        partnership: 'Partnership',
        other: 'Other'
    };
    return labels[value] || getEmailDisplayValue(value);
}

function isGetQuoteSubmission(enquiry) {
    return enquiry?.submissionType === 'get_quote';
}

function getEnquiryAdminListUrl() {
    return joinUrl(getAdminPanelUrl(), '/enquiries-applications/enquiries');
}

function getApplicationAdminListUrl() {
    return joinUrl(getAdminPanelUrl(), '/enquiries-applications/applications');
}

function getApplicationAdminCvUrl(application) {
    if (!application?._id || !application?.cvFile?.url) {
        return '';
    }

    return joinUrl(getAdminPanelUrl(), `/enquiries-applications/applications/${application._id}/cv`);
}

function getEmailLogoUrl() {
    return joinUrl(getPublicSiteUrl(), '/Logo/Logo.png');
}

function getEmailLogoAttachmentPath() {
    const candidates = [
        path.join(__dirname, '..', '..', 'frontend', 'public', 'Logo', 'Logo.png'),
        path.join(__dirname, '..', '..', 'admin-panel', 'public', 'images', 'frontend-logo.png'),
        path.join(__dirname, '..', '..', 'admin-panel', 'public', 'images', 'Logo.png'),
        path.join(__dirname, '..', '..', 'admin-panel', 'public', 'images', 'logo-small.png')
    ];

    for (const candidate of candidates) {
        try {
            require('fs').accessSync(candidate);
            return candidate;
        } catch (error) {
            // continue
        }
    }

    return '';
}

function getSocialIconKey(platform = '') {
    const normalized = String(platform).trim().toLowerCase();
    if (normalized.includes('linkedin') || normalized.includes('linkdin') || normalized.includes('linked in')) {
        return 'linkedin';
    }
    if (normalized.includes('facebook')) {
        return 'facebook';
    }
    if (normalized.includes('instagram')) {
        return 'instagram';
    }
    if (normalized.includes('youtube')) {
        return 'youtube';
    }
    if (normalized.includes('twitter') || normalized === 'x') {
        return 'x';
    }
    return 'generic';
}

function getEmailSocialIconAttachmentPath(iconKey) {
    const candidate = path.join(__dirname, '..', 'templates', 'emails', 'assets', `social-${iconKey}.png`);
    try {
        require('fs').accessSync(candidate);
        return candidate;
    } catch (error) {
        return '';
    }
}

function normalizeSocialLinks(footer) {
    const configuredLinks = Array.isArray(footer?.socialLinks)
        ? footer.socialLinks
            .filter((link) => link?.isFieldActive && link?.href && link.href !== '#')
            .map((link) => ({
                platform: getEmailDisplayValue(link.platform, 'Social'),
                href: link.href
            }))
        : [];

    return configuredLinks.length > 0 ? configuredLinks : DEFAULT_EMAIL_SOCIAL_LINKS;
}

function buildEmailHeader() {
    return `
                    <tr>
                        <td align="left" style="background:#ffffff; padding:20px 30px 16px; border-bottom:1px solid #e5e7eb;">
                            <img src="cid:acero-logo" alt="Acero Building Systems" width="132" height="45" style="display:block; width:132px; max-width:132px; height:45px; border:0; outline:none; text-decoration:none;">
                        </td>
                    </tr>`;
}

function buildEmailFooter(publicSiteUrl, socialLinks) {
    const linksHtml = socialLinks.map((social) => {
        const platform = escapeEmailHtml(social.platform);
        const href = escapeEmailHtml(social.href);
        const iconKey = getSocialIconKey(social.platform);
        const iconCid = `social-${iconKey}`;

        return `
                                            <td width="54" align="center" style="width:54px; padding:0 0 0 8px;">
                                                <a href="${href}" target="_blank" rel="noopener noreferrer" title="${platform}" style="text-decoration:none;">
                                                    <img src="cid:${iconCid}" alt="${platform}" width="44" height="44" style="display:block; width:44px; max-width:44px; height:44px; border:0; outline:none; text-decoration:none;">
                                                </a>
                                            </td>`;
    }).join('');

    return `
                    <tr>
                        <td style="background:#f8fafc; padding:22px 30px; border-top:1px solid #e5e7eb;">
                            <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                                <tr>
                                    <td align="left" style="vertical-align:middle;">
                                        <a href="${publicSiteUrl}" style="text-decoration:none;" target="_blank" rel="noopener noreferrer">
                                            <img src="cid:acero-logo" alt="Acero Building Systems" width="118" height="41" style="display:block; width:118px; max-width:118px; height:41px; border:0; outline:none; text-decoration:none;">
                                        </a>
                                        <div style="margin-top:8px; font-size:12px; line-height:1.6; color:#6b7280;">
                                            <a href="${publicSiteUrl}" style="color:#6b7280; text-decoration:none;" target="_blank" rel="noopener noreferrer">${publicSiteUrl}</a>
                                        </div>
                                    </td>
                                    <td align="right" style="vertical-align:middle; white-space:nowrap;">
                                        <table cellpadding="0" cellspacing="0" role="presentation" align="right">
                                            <tr>${linksHtml}
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>`;
}

async function getEmailTemplateData() {
    const publicSiteUrl = escapeEmailHtml(getPublicSiteUrl());
    let footer = null;

    try {
        footer = await FooterConfiguration.getPublished();
    } catch (error) {
        console.warn('Failed to load footer configuration for email branding:', error.message);
    }

    return {
        publicSiteUrl,
        emailLogoUrl: escapeEmailHtml(getEmailLogoUrl()),
        emailHeader: buildEmailHeader(),
        emailFooter: buildEmailFooter(publicSiteUrl, normalizeSocialLinks(footer))
    };
}
const STAGED_COMPARE_RESOURCES = new Set(['project', 'vacancy']);

function joinUrl(base, relativePath) {
    return `${String(base || '').replace(/\/+$/, '')}${relativePath.startsWith('/') ? relativePath : `/${relativePath}`}`;
}

function getWorkflowResourcePath(resource, resourceId) {
    if (resource === 'vacancy') {
        return `/enquiries-applications/vacancies/${resourceId}`;
    }
    if (resource === 'project') {
        return `/projects/${resourceId}`;
    }
    return `/${resource}s/${resourceId}`;
}

function getWorkflowComparePath(resource, resourceId) {
    if (!STAGED_COMPARE_RESOURCES.has(resource)) {
        return '';
    }
    return `/versions/${resource}/${resourceId}/compare?mode=live-draft`;
}

function buildCompareButtonRow(compareUrl, color = '#2563eb') {
    if (!compareUrl) return '';
    return `
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 16px 0 0;">
                                <tr>
                                    <td align="center">
                                        <a href="${compareUrl}" style="display: inline-block; background-color: #ffffff; color: ${color}; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: 600; font-size: 15px; border: 1px solid ${color};">
                                            View Changes
                                        </a>
                                    </td>
                                </tr>
                            </table>`;
}

function getWorkflowLinkData(resource, resourceId, color) {
    const adminPanelUrl = getAdminPanelUrl();
    const resourceUrl = joinUrl(adminPanelUrl, getWorkflowResourcePath(resource, resourceId));
    const comparePath = getWorkflowComparePath(resource, resourceId);
    const compareUrl = comparePath ? joinUrl(adminPanelUrl, comparePath) : '';
    return {
        adminPanelUrl,
        resourceUrl,
        compareUrl,
        compareButtonRow: buildCompareButtonRow(compareUrl, color)
    };
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
        // SMTP settings are managed from the admin panel. Cache briefly so public
        // forms do not query settings on every submission, but updates still take effect quickly.
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

            const html = this.replacePlaceholders(template, {
                ...(await getEmailTemplateData()),
                ...data
            });

            const mailOptions = {
                from: from || `${process.env.EMAIL_FROM_NAME || 'Acero CMS'} <${process.env.EMAIL_FROM || 'noreply@acero.com'}>`,
                to,
                subject,
                html
            };

            const attachments = [];

            if (html.includes('cid:acero-logo')) {
                const logoPath = getEmailLogoAttachmentPath();
                if (logoPath) {
                    attachments.push({
                        filename: 'acero-logo.png',
                        path: logoPath,
                        cid: 'acero-logo'
                    });
                }
            }

            ['linkedin', 'facebook', 'instagram', 'youtube', 'x', 'generic'].forEach((iconKey) => {
                const cid = `social-${iconKey}`;
                if (!html.includes(`cid:${cid}`)) return;

                const iconPath = getEmailSocialIconAttachmentPath(iconKey);
                if (!iconPath) return;

                attachments.push({
                    filename: `${cid}.png`,
                    path: iconPath,
                    cid
                });
            });

            if (attachments.length > 0) {
                mailOptions.attachments = attachments;
            }

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

            const { adminPanelUrl, resourceUrl, compareUrl, compareButtonRow } = getWorkflowLinkData(resource, resourceId, '#667eea');

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
                        compareUrl,
                        compareButtonRow,
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

            const { adminPanelUrl, resourceUrl, compareUrl, compareButtonRow } = getWorkflowLinkData(resource, resourceId, '#3b82f6');

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
                    compareUrl,
                    compareButtonRow,
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

            const { adminPanelUrl, resourceUrl, compareUrl, compareButtonRow } = getWorkflowLinkData(resource, resourceId, '#10b981');

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
                    compareUrl,
                    compareButtonRow,
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
                            editorName: admin.firstName,
                            adminName: admin.firstName,
                            approverName: `${approver.firstName} ${approver.lastName}`,
                            resourceType: resource,
                            resourceTitle,
                            resourceUrl,
                            adminPanelUrl,
                            compareUrl,
                            compareButtonRow,
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

            const { adminPanelUrl, resourceUrl, compareUrl, compareButtonRow } = getWorkflowLinkData(resource, resourceId, '#f59e0b');

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
                    adminPanelUrl,
                    compareUrl,
                    compareButtonRow
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
                            editorName: admin.firstName,
                            adminName: admin.firstName,
                            approverName: `${approver.firstName} ${approver.lastName}`,
                            resourceType: resource,
                            resourceTitle,
                            feedback: feedback || 'No specific feedback provided',
                            changeSummary: changeSummary || 'No change summary provided',
                            resourceUrl,
                            adminPanelUrl,
                            compareUrl,
                            compareButtonRow
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

            const { adminPanelUrl, resourceUrl, compareUrl, compareButtonRow } = getWorkflowLinkData(resource, resourceId, '#ef4444');

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
                    adminPanelUrl,
                    compareUrl,
                    compareButtonRow
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

            const { adminPanelUrl, resourceUrl, compareUrl, compareButtonRow } = getWorkflowLinkData(resource, resourceId, '#3b82f6');

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
                        editorName: approver.firstName,
                        approverName: approver.firstName,
                        reviewerName: `${reviewer.firstName} ${reviewer.lastName}`,
                        resourceType: resource,
                        resourceTitle,
                        resourceUrl,
                        adminPanelUrl,
                        compareUrl,
                        compareButtonRow,
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

            const { adminPanelUrl, resourceUrl } = getWorkflowLinkData(resource, resourceId);
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

            const isQuote = isGetQuoteSubmission(enquiry);
            const subject = isQuote
                ? 'New Get Quote Request from ' + (enquiry.fullName || 'Visitor')
                : 'New Enquiry from ' + (enquiry.fullName || 'Visitor');

            const templateName = isQuote ? 'get-quote-submitted' : 'enquiry-submitted';
            const submittedAt = escapeEmailHtml(formatEmailDate(enquiry.submittedAt));
            const mobileNumberDisplay = escapeEmailHtml(
                getMobileNumberDisplay(enquiry.mobileNumber, enquiry.countryCode, enquiry.country)
            );

            const data = isQuote
                ? {
                    fullName: escapeEmailHtml(enquiry.fullName || ''),
                    email: escapeEmailHtml(enquiry.email || ''),
                    countryDisplay: escapeEmailHtml(getEmailDisplayValue(enquiry.country)),
                    mobileNumberDisplay,
                    submittedAt,
                    message: escapeEmailHtml(getEmailDisplayValue(enquiry.message, 'Website header Get Quote popup submitted.')),
                    adminListUrl: escapeEmailHtml(getEnquiryAdminListUrl())
                }
                : {
                    submissionLabel: escapeEmailHtml('New Website Enquiry'),
                    fullName: escapeEmailHtml(enquiry.fullName || ''),
                    email: escapeEmailHtml(enquiry.email || ''),
                    mobileNumberDisplay,
                    telephoneNumberDisplay: escapeEmailHtml(getEmailDisplayValue(enquiry.telephoneNumber)),
                    countryDisplay: escapeEmailHtml(getEmailDisplayValue(enquiry.country)),
                    companyNameDisplay: escapeEmailHtml(getEmailDisplayValue(enquiry.companyName)),
                    purpose: escapeEmailHtml(getPurposeLabel(enquiry.purpose)),
                    subject: escapeEmailHtml(enquiry.subject || ''),
                    message: escapeEmailHtml(getEmailDisplayValue(enquiry.message)),
                    submittedAt,
                    adminListUrl: escapeEmailHtml(getEnquiryAdminListUrl())
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

            const isQuote = isGetQuoteSubmission(enquiry);
            const data = {
                fullName: escapeEmailHtml(enquiry.fullName || 'there'),
                email: escapeEmailHtml(enquiry.email || ''),
                subject: escapeEmailHtml(enquiry.subject || ''),
                purpose: escapeEmailHtml(getPurposeLabel(enquiry.purpose)),
                countryDisplay: escapeEmailHtml(getEmailDisplayValue(enquiry.country)),
                mobileNumberDisplay: escapeEmailHtml(
                    getMobileNumberDisplay(enquiry.mobileNumber, enquiry.countryCode, enquiry.country)
                ),
                submittedAt: escapeEmailHtml(formatEmailDate(enquiry.submittedAt)),
                publicSiteUrl: escapeEmailHtml(getPublicSiteUrl()),
                emailLogoUrl: escapeEmailHtml(getEmailLogoUrl())
            };

            return await this.sendEmail(
                enquiry.email,
                isQuote
                    ? 'We received your quote request - Acero Building Systems'
                    : 'We received your enquiry - Acero Building Systems',
                isQuote ? 'get-quote-confirmation' : 'enquiry-confirmation',
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
            const fullName = ((application.firstName || '') + ' ' + (application.lastName || '')).trim() || 'there';
            const data = {
                fullName: escapeEmailHtml(fullName),
                vacancyTitle: escapeEmailHtml(vacancy?.title || 'the selected position'),
                department: escapeEmailHtml(getEmailDisplayValue(vacancy?.department)),
                mobileNumberDisplay: escapeEmailHtml(
                    getMobileNumberDisplay(application.mobileNumber, application.countryCode, application.country)
                ),
                submittedAt: escapeEmailHtml(formatEmailDate(application.submittedAt)),
                publicSiteUrl: escapeEmailHtml(getPublicSiteUrl()),
                emailLogoUrl: escapeEmailHtml(getEmailLogoUrl())
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
            const vacancy = await Vacancy.findById(application.vacancyId).lean();
            const activeConfig = await FormConfiguration.getActive();
            const toEmail = (vacancy && vacancy.notificationEmail) || activeConfig?.defaultApplicationEmail;

            if (!toEmail) {
                console.warn('No notification email configured for application submission');
                return false;
            }

            const fullName = ((application.firstName || '') + ' ' + (application.lastName || '')).trim();
            const subject = 'New Application: ' + (fullName || 'Candidate');
            const templateName = 'application-submitted';
            const engineeringDegreeValue = application.hasEngineeringDegree;
            const engineeringDegreeLabel =
                typeof engineeringDegreeValue === 'boolean'
                    ? (engineeringDegreeValue ? 'Yes' : 'No')
                    : getEmailDisplayValue(engineeringDegreeValue);

            const data = {
                fullName: escapeEmailHtml(fullName),
                email: escapeEmailHtml(application.email || ''),
                mobileNumberDisplay: escapeEmailHtml(
                    getMobileNumberDisplay(application.mobileNumber, application.countryCode, application.country)
                ),
                countryDisplay: escapeEmailHtml(getEmailDisplayValue(application.country)),
                vacancyTitle: escapeEmailHtml(vacancy?.title || ''),
                department: escapeEmailHtml(getEmailDisplayValue(vacancy?.department)),
                experienceLevel: escapeEmailHtml(getEmailDisplayValue(application.experienceLevel)),
                educationLevel: escapeEmailHtml(getEmailDisplayValue(application.educationLevel)),
                hasEngineeringDegree: escapeEmailHtml(engineeringDegreeLabel),
                languagesDisplay: escapeEmailHtml(
                    Array.isArray(application.languages) && application.languages.length > 0
                        ? application.languages.join(', ')
                        : 'Not provided'
                ),
                coverLetterDisplay: escapeEmailHtml(getEmailDisplayValue(application.coverLetter)),
                submittedAt: escapeEmailHtml(formatEmailDate(application.submittedAt)),
                cvUrl: escapeEmailHtml(getApplicationAdminCvUrl(application)),
                adminListUrl: escapeEmailHtml(getApplicationAdminListUrl())
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



