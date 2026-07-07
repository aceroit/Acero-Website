const fs = require('fs');
const path = require('path');
const Application = require('../models/Application');
const Vacancy = require('../models/Vacancy');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const notificationService = require('../services/notificationService');
const { getUploadRoot } = require('../utils/localFileStorage');

function escapeRegExp(value = '') {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeHtml(value = '') {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function cleanText(value = '') {
    return String(value || '').replace(/\s+/g, ' ').trim();
}

function sanitizeFilename(value = 'Untitled') {
    const cleaned = cleanText(value)
        .replace(/[<>:"/\\|?*\x00-\x1f]/g, '-')
        .replace(/\.+$/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    return (cleaned || 'Untitled').slice(0, 120);
}

function getApplicationName(application) {
    return cleanText(`${application.firstName || ''} ${application.lastName || ''}`) || 'Candidate';
}

function getVacancyTitle(application) {
    return application.vacancyId?.title || 'Unassigned Vacancy';
}

function getSubmittedDate(application) {
    if (!application.submittedAt) return '';
    return new Date(application.submittedAt).toISOString().slice(0, 10);
}

function getCvUrl(application) {
    return application.cvFile?.url || '';
}

function getCvRelativePath(application) {
    const publicId = application.cvFile?.publicId;
    if (publicId && !/^https?:\/\//i.test(publicId)) {
        return publicId.replace(/^\/uploads\//, '').replace(/^uploads\//, '');
    }

    const url = application.cvFile?.url || '';
    const marker = '/uploads/';
    const index = url.indexOf(marker);
    if (index >= 0) {
        return decodeURIComponent(url.slice(index + marker.length));
    }

    return null;
}

function getCvLocalPath(application) {
    const relativePath = getCvRelativePath(application);
    if (!relativePath) return null;

    const uploadRoot = getUploadRoot();
    const filePath = path.resolve(uploadRoot, relativePath);
    const relative = path.relative(uploadRoot, filePath);

    if (relative.startsWith('..') || path.isAbsolute(relative)) return null;
    return filePath;
}

function getCvExtension(application) {
    const candidates = [
        application.cvFile?.filename,
        application.cvFile?.publicId,
        application.cvFile?.url,
    ];

    for (const candidate of candidates) {
        const ext = path.extname(String(candidate || '').split('?')[0]);
        if (ext) return ext.toLowerCase();
    }

    return '.pdf';
}

function formatDateTime(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString().replace('T', ' ').slice(0, 16);
}

async function buildApplicationQuery(params = {}) {
    const {
        status,
        vacancyId,
        email,
        search,
        startDate,
        endDate,
        country,
        experienceLevel,
        educationLevel,
    } = params;

    const query = { isActive: true };

    if (status) query.status = status;
    if (vacancyId) query.vacancyId = vacancyId;
    if (email) query.email = email;
    if (country) query.country = country;
    if (experienceLevel) query.experienceLevel = experienceLevel;
    if (educationLevel) query.educationLevel = educationLevel;

    if (startDate || endDate) {
        query.submittedAt = {};
        if (startDate) query.submittedAt.$gte = new Date(startDate);
        if (endDate) query.submittedAt.$lte = new Date(endDate);
    }

    if (search) {
        const searchRegex = new RegExp(escapeRegExp(search), 'i');
        const matchingVacancyIds = await Vacancy.find({
            $or: [
                { title: searchRegex },
                { department: searchRegex },
                { location: searchRegex },
            ],
        }).distinct('_id');

        query.$or = [
            { firstName: searchRegex },
            { lastName: searchRegex },
            { email: searchRegex },
            { mobileNumber: searchRegex },
            { country: searchRegex },
            { coverLetter: searchRegex },
            ...(matchingVacancyIds.length ? [{ vacancyId: { $in: matchingVacancyIds } }] : []),
        ];
    }

    return query;
}

async function getFilteredApplications(params = {}) {
    const { sortBy = 'submittedAt', sortOrder = 'desc' } = params;
    const query = await buildApplicationQuery(params);
    const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    return Application.find(query)
        .populate('vacancyId', 'title department location type')
        .populate('reviewedBy', 'firstName lastName email')
        .sort(sortOptions)
        .lean();
}

function getExportFilename(type, ext) {
    const date = new Date().toISOString().slice(0, 10);
    return `acero-applications-${type}-${date}.${ext}`;
}

function getExportRows(applications) {
    return applications.map((application, index) => ({
        no: index + 1,
        firstName: application.firstName || '',
        lastName: application.lastName || '',
        name: getApplicationName(application),
        email: application.email || '',
        phone: application.mobileNumber || '',
        country: application.country || '',
        vacancy: getVacancyTitle(application),
        department: application.vacancyId?.department || '',
        location: application.vacancyId?.location || '',
        experience: application.experienceLevel || '',
        education: application.educationLevel || '',
        engineeringDegree: application.hasEngineeringDegree || '',
        languages: Array.isArray(application.languages) ? application.languages.join(', ') : '',
        status: application.status || '',
        submittedAt: formatDateTime(application.submittedAt),
        coverLetter: application.coverLetter || '',
        cvUrl: getCvUrl(application),
    }));
}

function sendDownload(res, buffer, filename, contentType) {
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    return res.send(buffer);
}

function buildExcelBuffer(applications) {
    const rows = getExportRows(applications);
    const columns = [
        ['No.', 'no'],
        ['First Name', 'firstName'],
        ['Last Name', 'lastName'],
        ['Email', 'email'],
        ['Phone', 'phone'],
        ['Country', 'country'],
        ['Vacancy', 'vacancy'],
        ['Department', 'department'],
        ['Location', 'location'],
        ['Experience', 'experience'],
        ['Education', 'education'],
        ['Engineering Degree', 'engineeringDegree'],
        ['Languages', 'languages'],
        ['Status', 'status'],
        ['Submitted At', 'submittedAt'],
        ['Cover Letter', 'coverLetter'],
        ['CV Link', 'cvUrl'],
    ];

    const htmlRows = [
        '<tr>' + columns.map(([label]) => `<th>${escapeHtml(label)}</th>`).join('') + '</tr>',
        ...rows.map((row) => '<tr>' + columns.map(([, key]) => {
            const value = row[key] || '';
            if (key === 'cvUrl' && value) {
                return `<td><a href="${escapeHtml(value)}">View CV</a></td>`;
            }
            return `<td>${escapeHtml(value)}</td>`;
        }).join('') + '</tr>'),
    ].join('');

    const html = `<!doctype html><html><head><meta charset="utf-8" />
<style>
table{border-collapse:collapse;font-family:Arial,sans-serif;font-size:12px;}th{background:#1f2937;color:#fff;font-weight:bold;}th,td{border:1px solid #d9e2ec;padding:7px 9px;vertical-align:top;}td{mso-number-format:"\\@";}a{color:#1268d9;}
</style></head><body><table>${htmlRows}</table></body></html>`;

    return Buffer.from(html, 'utf8');
}

function pdfEscape(value = '') {
    return String(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function wrapText(value, maxLength) {
    const words = cleanText(value).split(' ');
    const lines = [];
    let current = '';

    for (const word of words) {
        const next = current ? `${current} ${word}` : word;
        if (next.length > maxLength && current) {
            lines.push(current);
            current = word;
        } else {
            current = next;
        }
    }

    if (current) lines.push(current);
    return lines.length ? lines : [''];
}

function buildPdfBuffer(applications) {
    const rows = getExportRows(applications);
    const objects = [];
    const pages = [];
    const fontObjectId = 3;
    const width = 842;
    const height = 595;
    const margin = 38;

    function addObject(content) {
        objects.push(content);
        return objects.length;
    }

    function addPage(lines, annotations) {
        const content = [
            'BT',
            '/F1 18 Tf',
            '38 552 Td',
            `(Acero Job Applications Export) Tj`,
            '/F1 9 Tf',
            `0 -18 Td`,
            `(${pdfEscape(`Generated ${formatDateTime(new Date())} | ${applications.length} applications`)}) Tj`,
        ];

        let cursorY = 504;
        lines.forEach((line) => {
            content.push(`1 0 0 1 ${margin} ${cursorY} Tm`);
            content.push(`(${pdfEscape(line)}) Tj`);
            cursorY -= 13;
        });
        content.push('ET');

        const stream = content.join('\n');
        const contentId = addObject(`<< /Length ${Buffer.byteLength(stream, 'utf8')} >>\nstream\n${stream}\nendstream`);
        const annotationIds = annotations.map((annotation) => addObject(annotation));
        const pageId = addObject('');
        objects[pageId - 1] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Resources << /Font << /F1 ${fontObjectId} 0 R >> >> /Contents ${contentId} 0 R /Annots [${annotationIds.map((id) => `${id} 0 R`).join(' ')}] >>`;
        pages.push(pageId);
    }

    addObject('<< /Type /Catalog /Pages 2 0 R >>');
    addObject('');
    addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');

    let currentLines = [];
    let currentAnnotations = [];
    let y = 504;

    function flushPage() {
        addPage(currentLines, currentAnnotations);
        currentLines = [];
        currentAnnotations = [];
        y = 504;
    }

    rows.forEach((row) => {
        const rowLines = [
            `${row.no}. ${row.name} | ${row.vacancy} | ${row.status}`,
            `Email: ${row.email} | Phone: ${row.phone} | Country: ${row.country}`,
            `Experience: ${row.experience} | Education: ${row.education} | Submitted: ${row.submittedAt}`,
            ...wrapText(`Cover Letter: ${row.coverLetter}`, 130),
            row.cvUrl ? `CV: ${row.cvUrl}` : 'CV: Not uploaded',
            '',
        ];

        if (y - rowLines.length * 13 < 34 && currentLines.length) {
            flushPage();
        }

        rowLines.forEach((line) => {
            currentLines.push(line);
            if (line.startsWith('CV: http')) {
                const link = line.replace(/^CV:\s*/, '');
                currentAnnotations.push(`<< /Type /Annot /Subtype /Link /Rect [${margin} ${y - 2} ${width - margin} ${y + 10}] /Border [0 0 0] /A << /S /URI /URI (${pdfEscape(link)}) >> >>`);
            }
            y -= 13;
        });
    });

    if (currentLines.length || rows.length === 0) {
        if (rows.length === 0) currentLines.push('No applications matched the selected filters.');
        flushPage();
    }

    objects[1] = `<< /Type /Pages /Kids [${pages.map((id) => `${id} 0 R`).join(' ')}] /Count ${pages.length} >>`;

    const chunks = ['%PDF-1.4\n'];
    const offsets = [0];

    objects.forEach((object, index) => {
        offsets[index + 1] = Buffer.byteLength(chunks.join(''), 'utf8');
        chunks.push(`${index + 1} 0 obj\n${object}\nendobj\n`);
    });

    const xrefOffset = Buffer.byteLength(chunks.join(''), 'utf8');
    chunks.push(`xref\n0 ${objects.length + 1}\n`);
    chunks.push('0000000000 65535 f \n');
    for (let i = 1; i <= objects.length; i += 1) {
        chunks.push(`${String(offsets[i]).padStart(10, '0')} 00000 n \n`);
    }
    chunks.push(`trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);

    return Buffer.from(chunks.join(''), 'utf8');
}

function makeCrcTable() {
    const table = [];
    for (let n = 0; n < 256; n += 1) {
        let c = n;
        for (let k = 0; k < 8; k += 1) {
            c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        }
        table[n] = c >>> 0;
    }
    return table;
}

const crcTable = makeCrcTable();

function crc32(buffer) {
    let crc = 0xffffffff;
    for (const byte of buffer) {
        crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
}

function getDosDateTime(date = new Date()) {
    const year = Math.max(date.getFullYear(), 1980);
    const time = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
    const day = (year - 1980) << 9 | ((date.getMonth() + 1) << 5) | date.getDate();
    return { time, day };
}

function uint16(value) {
    const buffer = Buffer.alloc(2);
    buffer.writeUInt16LE(value & 0xffff, 0);
    return buffer;
}

function uint32(value) {
    const buffer = Buffer.alloc(4);
    buffer.writeUInt32LE(value >>> 0, 0);
    return buffer;
}

function buildZipBuffer(files) {
    const localParts = [];
    const centralParts = [];
    let offset = 0;
    const { time, day } = getDosDateTime();

    files.forEach((file) => {
        const nameBuffer = Buffer.from(file.name, 'utf8');
        const data = file.data;
        const crc = crc32(data);

        const localHeader = Buffer.concat([
            uint32(0x04034b50), uint16(20), uint16(0x0800), uint16(0), uint16(time), uint16(day),
            uint32(crc), uint32(data.length), uint32(data.length), uint16(nameBuffer.length), uint16(0), nameBuffer,
        ]);

        const centralHeader = Buffer.concat([
            uint32(0x02014b50), uint16(20), uint16(20), uint16(0x0800), uint16(0), uint16(time), uint16(day),
            uint32(crc), uint32(data.length), uint32(data.length), uint16(nameBuffer.length), uint16(0), uint16(0),
            uint16(0), uint16(0), uint32(0), uint32(offset), nameBuffer,
        ]);

        localParts.push(localHeader, data);
        centralParts.push(centralHeader);
        offset += localHeader.length + data.length;
    });

    const centralStart = offset;
    const centralDirectory = Buffer.concat(centralParts);
    const end = Buffer.concat([
        uint32(0x06054b50), uint16(0), uint16(0), uint16(files.length), uint16(files.length),
        uint32(centralDirectory.length), uint32(centralStart), uint16(0),
    ]);

    return Buffer.concat([...localParts, centralDirectory, end]);
}

function buildZipFiles(applications) {
    const files = [];
    const usedNames = new Map();
    const missing = [];

    applications.forEach((application, index) => {
        const cvPath = getCvLocalPath(application);
        if (!cvPath || !fs.existsSync(cvPath)) {
            missing.push(`${index + 1}. ${getApplicationName(application)} - ${getVacancyTitle(application)} - CV missing (${getCvUrl(application) || 'no URL'})`);
            return;
        }

        const vacancyFolder = sanitizeFilename(getVacancyTitle(application));
        const submitted = getSubmittedDate(application);
        const candidate = sanitizeFilename(getApplicationName(application));
        const ext = getCvExtension(application);
        const baseName = sanitizeFilename(`${submitted ? `${submitted} - ` : ''}${candidate}`);
        let fileName = `Acero Applications Export/${vacancyFolder}/${baseName}${ext}`;
        const count = usedNames.get(fileName) || 0;
        usedNames.set(fileName, count + 1);
        if (count > 0) {
            fileName = `Acero Applications Export/${vacancyFolder}/${baseName} (${count + 1})${ext}`;
        }

        files.push({
            name: fileName,
            data: fs.readFileSync(cvPath),
        });
    });

    if (missing.length) {
        files.push({
            name: 'Acero Applications Export/_missing-cvs.txt',
            data: Buffer.from(missing.join('\n'), 'utf8'),
        });
    }

    if (!files.length) {
        files.push({
            name: 'Acero Applications Export/_no-cvs-found.txt',
            data: Buffer.from('No CV files matched the selected filters.', 'utf8'),
        });
    }

    return files;
}

/**
 * Get all applications (with filters and pagination)
 */
exports.getAllApplications = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            sortBy = 'submittedAt',
            sortOrder = 'desc'
        } = req.query;

        const query = await buildApplicationQuery(req.query);
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

        const [applications, total] = await Promise.all([
            Application.find(query)
                .populate('vacancyId', 'title department location type')
                .populate('reviewedBy', 'firstName lastName email')
                .sort(sortOptions)
                .skip(skip)
                .limit(parseInt(limit)),
            Application.countDocuments(query)
        ]);

        return successResponse(res, 200, 'Applications retrieved successfully', {
            applications,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error in getAllApplications:', error);
        return errorResponse(res, 500, 'Failed to retrieve applications', error.message);
    }
};

/**
 * Get filter options for applications
 */
exports.getApplicationFilters = async (req, res) => {
    try {
        const [countries, experienceLevels, educationLevels] = await Promise.all([
            Application.distinct('country', { isActive: true, country: { $nin: [null, ''] } }),
            Application.distinct('experienceLevel', { isActive: true, experienceLevel: { $nin: [null, ''] } }),
            Application.distinct('educationLevel', { isActive: true, educationLevel: { $nin: [null, ''] } }),
        ]);

        return successResponse(res, 200, 'Application filters retrieved successfully', {
            countries: countries.sort(),
            experienceLevels: experienceLevels.sort(),
            educationLevels: educationLevels.sort(),
        });
    } catch (error) {
        console.error('Error in getApplicationFilters:', error);
        return errorResponse(res, 500, 'Failed to retrieve application filters', error.message);
    }
};

exports.exportApplicationsExcel = async (req, res) => {
    try {
        const applications = await getFilteredApplications(req.query);
        const buffer = buildExcelBuffer(applications);
        return sendDownload(
            res,
            buffer,
            getExportFilename('excel', 'xls'),
            'application/vnd.ms-excel; charset=utf-8'
        );
    } catch (error) {
        console.error('Error in exportApplicationsExcel:', error);
        return errorResponse(res, 500, 'Failed to export applications to Excel', error.message);
    }
};

exports.exportApplicationsPdf = async (req, res) => {
    try {
        const applications = await getFilteredApplications(req.query);
        const buffer = buildPdfBuffer(applications);
        return sendDownload(
            res,
            buffer,
            getExportFilename('pdf', 'pdf'),
            'application/pdf'
        );
    } catch (error) {
        console.error('Error in exportApplicationsPdf:', error);
        return errorResponse(res, 500, 'Failed to export applications to PDF', error.message);
    }
};

exports.exportApplicationsZip = async (req, res) => {
    try {
        const applications = await getFilteredApplications(req.query);
        const files = buildZipFiles(applications);
        const buffer = buildZipBuffer(files);
        return sendDownload(
            res,
            buffer,
            getExportFilename('cvs', 'zip'),
            'application/zip'
        );
    } catch (error) {
        console.error('Error in exportApplicationsZip:', error);
        return errorResponse(res, 500, 'Failed to export application CVs', error.message);
    }
};

/**
 * Get single application by ID
 */
exports.getApplicationById = async (req, res) => {
    try {
        const { id } = req.params;

        const application = await Application.findOne({ _id: id, isActive: true })
            .populate('vacancyId', 'title department location type')
            .populate('reviewedBy', 'firstName lastName email');

        if (!application) {
            return errorResponse(res, 404, 'Application not found');
        }

        return successResponse(res, 200, 'Application retrieved successfully', { application });
    } catch (error) {
        console.error('Error in getApplicationById:', error);
        return errorResponse(res, 500, 'Failed to retrieve application', error.message);
    }
};

/**
 * Create new application
 */
exports.createApplication = async (req, res) => {
    try {
        const applicationData = {
            ...req.body
        };

        const application = new Application(applicationData);
        await application.save();

        // Notify via email if configured (will be implemented in notificationService)
        if (notificationService.notifyApplicationSubmission) {
            notificationService.notifyApplicationSubmission(application);
        }

        return successResponse(
            res,
            201,
            'Application created successfully',
            { application }
        );
    } catch (error) {
        console.error('Error in createApplication:', error);
        if (error.name === 'ValidationError') {
            return errorResponse(res, 400, 'Validation error', error.message);
        }
        return errorResponse(res, 500, 'Failed to create application', error.message);
    }
};

/**
 * Update application
 */
exports.updateApplication = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const application = await Application.findOne({ _id: id, isActive: true });
        if (!application) {
            return errorResponse(res, 404, 'Application not found');
        }

        Object.keys(updateData).forEach(key => {
            if (updateData[key] !== undefined && key !== '_id') {
                application[key] = updateData[key];
            }
        });

        await application.save();

        const updatedApplication = await Application.findById(application._id)
            .populate('vacancyId', 'title department location type')
            .populate('reviewedBy', 'firstName lastName email');

        return successResponse(
            res,
            200,
            'Application updated successfully',
            { application: updatedApplication }
        );
    } catch (error) {
        console.error('Error in updateApplication:', error);
        if (error.name === 'ValidationError') {
            return errorResponse(res, 400, 'Validation error', error.message);
        }
        return errorResponse(res, 500, 'Failed to update application', error.message);
    }
};

/**
 * Delete application (soft delete)
 */
exports.deleteApplication = async (req, res) => {
    try {
        const { id } = req.params;

        const application = await Application.findOne({ _id: id, isActive: true });
        if (!application) {
            return errorResponse(res, 404, 'Application not found');
        }

        application.isActive = false;
        await application.save();

        return successResponse(
            res,
            200,
            'Application deleted successfully',
            { application: { _id: application._id, isActive: false } }
        );
    } catch (error) {
        console.error('Error in deleteApplication:', error);
        return errorResponse(res, 500, 'Failed to delete application', error.message);
    }
};

/**
 * Mark application as reviewing
 */
exports.markReviewing = async (req, res) => {
    try {
        const { id } = req.params;

        const application = await Application.findOne({ _id: id, isActive: true });
        if (!application) {
            return errorResponse(res, 404, 'Application not found');
        }

        application.status = 'reviewing';
        application.reviewedBy = req.user?._id || null;
        application.reviewedAt = new Date();
        await application.save();

        const updatedApplication = await Application.findById(application._id)
            .populate('vacancyId', 'title department location type')
            .populate('reviewedBy', 'firstName lastName email');

        return successResponse(res, 200, 'Application marked as reviewing', { application: updatedApplication });
    } catch (error) {
        console.error('Error in markReviewing:', error);
        return errorResponse(res, 500, 'Failed to mark application as reviewing', error.message);
    }
};

/**
 * Shortlist application
 */
exports.shortlistApplication = async (req, res) => {
    try {
        const { id } = req.params;

        const application = await Application.findOne({ _id: id, isActive: true });
        if (!application) {
            return errorResponse(res, 404, 'Application not found');
        }

        application.status = 'shortlisted';
        application.reviewedBy = req.user?._id || application.reviewedBy || null;
        application.reviewedAt = application.reviewedAt || new Date();
        await application.save();

        const updatedApplication = await Application.findById(application._id)
            .populate('vacancyId', 'title department location type')
            .populate('reviewedBy', 'firstName lastName email');

        return successResponse(res, 200, 'Application shortlisted', { application: updatedApplication });
    } catch (error) {
        console.error('Error in shortlistApplication:', error);
        return errorResponse(res, 500, 'Failed to shortlist application', error.message);
    }
};

/**
 * Reject application
 */
exports.rejectApplication = async (req, res) => {
    try {
        const { id } = req.params;

        const application = await Application.findOne({ _id: id, isActive: true });
        if (!application) {
            return errorResponse(res, 404, 'Application not found');
        }

        application.status = 'rejected';
        application.reviewedBy = req.user?._id || application.reviewedBy || null;
        application.reviewedAt = application.reviewedAt || new Date();
        await application.save();

        const updatedApplication = await Application.findById(application._id)
            .populate('vacancyId', 'title department location type')
            .populate('reviewedBy', 'firstName lastName email');

        return successResponse(res, 200, 'Application rejected', { application: updatedApplication });
    } catch (error) {
        console.error('Error in rejectApplication:', error);
        return errorResponse(res, 500, 'Failed to reject application', error.message);
    }
};

/**
 * Archive application
 */
exports.archiveApplication = async (req, res) => {
    try {
        const { id } = req.params;

        const application = await Application.findOne({ _id: id, isActive: true });
        if (!application) {
            return errorResponse(res, 404, 'Application not found');
        }

        application.status = 'archived';
        application.reviewedBy = req.user?._id || application.reviewedBy || null;
        application.reviewedAt = application.reviewedAt || new Date();
        await application.save();

        const updatedApplication = await Application.findById(application._id)
            .populate('vacancyId', 'title department location type')
            .populate('reviewedBy', 'firstName lastName email');

        return successResponse(res, 200, 'Application archived', { application: updatedApplication });
    } catch (error) {
        console.error('Error in archiveApplication:', error);
        return errorResponse(res, 500, 'Failed to archive application', error.message);
    }
};