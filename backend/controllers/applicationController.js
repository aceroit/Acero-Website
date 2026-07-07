const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
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

function escapeXml(value = '') {
    return String(value)
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, ' ')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function getColumnName(index) {
    let name = '';
    let current = index;

    while (current > 0) {
        const remainder = (current - 1) % 26;
        name = String.fromCharCode(65 + remainder) + name;
        current = Math.floor((current - 1) / 26);
    }

    return name;
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
        { label: '#', key: 'no', width: 6, style: 3 },
        { label: 'First Name', key: 'firstName', width: 20, style: 3 },
        { label: 'Last Name', key: 'lastName', width: 20, style: 3 },
        { label: 'Email', key: 'email', width: 34, style: 3 },
        { label: 'Phone', key: 'phone', width: 18, style: 3 },
        { label: 'Country', key: 'country', width: 20, style: 3 },
        { label: 'Vacancy', key: 'vacancy', width: 28, style: 3 },
        { label: 'Department', key: 'department', width: 24, style: 3 },
        { label: 'Location', key: 'location', width: 24, style: 3 },
        { label: 'Experience', key: 'experience', width: 16, style: 3 },
        { label: 'Education', key: 'education', width: 20, style: 3 },
        { label: 'Eng. Degree', key: 'engineeringDegree', width: 14, style: 3 },
        { label: 'Languages', key: 'languages', width: 18, style: 3 },
        { label: 'Status', key: 'status', width: 14, style: 3 },
        { label: 'Submitted At', key: 'submittedAt', width: 20, style: 3 },
        { label: 'Cover Letter', key: 'coverLetter', width: 60, style: 4 },
        { label: 'CV Link', key: 'cvUrl', width: 16, style: 5 },
    ];

    const lastColumn = getColumnName(columns.length);
    const generatedAt = formatDateTime(new Date());
    const hyperlinks = [];

    function cell(ref, value, styleId = 0) {
        const safeValue = escapeXml(value || '');
        const style = styleId ? ` s="${styleId}"` : '';
        return `<c r="${ref}" t="inlineStr"${style}><is><t>${safeValue}</t></is></c>`;
    }

    const sheetRows = [];
    sheetRows.push(`<row r="1" ht="30"><c r="A1" t="inlineStr" s="1"><is><t>ACERO Job Applications Export</t></is></c></row>`);
    sheetRows.push(`<row r="2" ht="22"><c r="A2" t="inlineStr" s="2"><is><t>Generated ${escapeXml(generatedAt)} | ${rows.length} applications | Filtered export from Acero CMS</t></is></c></row>`);
    sheetRows.push('<row r="3" ht="8"></row>');

    const headerRowNumber = 4;
    sheetRows.push(`<row r="${headerRowNumber}" ht="24">${columns.map((column, index) => cell(`${getColumnName(index + 1)}${headerRowNumber}`, column.label, 6)).join('')}</row>`);

    rows.forEach((row, rowIndex) => {
        const rowNumber = rowIndex + 5;
        const cells = columns.map((column, columnIndex) => {
            const ref = `${getColumnName(columnIndex + 1)}${rowNumber}`;
            if (column.key === 'cvUrl') {
                if (row.cvUrl) {
                    hyperlinks.push({ ref, url: row.cvUrl });
                    return cell(ref, 'View CV', 5);
                }
                return cell(ref, 'No CV', 3);
            }
            return cell(ref, row[column.key], column.style || 3);
        }).join('');
        sheetRows.push(`<row r="${rowNumber}" ht="${row.coverLetter && row.coverLetter.length > 120 ? 54 : 28}">${cells}</row>`);
    });

    const dimensionEnd = `${lastColumn}${Math.max(rows.length + 4, 4)}`;
    const colsXml = columns.map((column, index) => `<col min="${index + 1}" max="${index + 1}" width="${column.width}" customWidth="1"/>`).join('');
    const hyperlinksXml = hyperlinks.length
        ? `<hyperlinks>${hyperlinks.map((link, index) => `<hyperlink ref="${link.ref}" r:id="rId${index + 1}" display="View CV"/>`).join('')}</hyperlinks>`
        : '';

    const worksheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<dimension ref="A1:${dimensionEnd}"/>
<sheetViews><sheetView workbookViewId="0"><pane ySplit="4" topLeftCell="A5" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
<sheetFormatPr defaultRowHeight="18"/>
<cols>${colsXml}</cols>
<sheetData>${sheetRows.join('')}</sheetData>
<autoFilter ref="A4:${lastColumn}${Math.max(rows.length + 4, 4)}"/>
<mergeCells count="2"><mergeCell ref="A1:${lastColumn}1"/><mergeCell ref="A2:${lastColumn}2"/></mergeCells>
${hyperlinksXml}
<pageMargins left="0.25" right="0.25" top="0.5" bottom="0.5" header="0.2" footer="0.2"/>
</worksheet>`;

    const worksheetRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${hyperlinks.map((link, index) => `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="${escapeXml(link.url)}" TargetMode="External"/>`).join('')}
</Relationships>`;

    const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<fonts count="6"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="18"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font><font><i/><sz val="10"/><color rgb="FF64748B"/><name val="Calibri"/></font><font><sz val="11"/><name val="Calibri"/></font><font><sz val="10"/><name val="Calibri"/></font><font><u/><sz val="11"/><color rgb="FF0563C1"/><name val="Calibri"/></font></fonts>
<fills count="5"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFB81725"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF8FAFC"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FF1F2937"/><bgColor indexed="64"/></patternFill></fill></fills>
<borders count="3"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FFD8DEE9"/></left><right style="thin"><color rgb="FFD8DEE9"/></right><top style="thin"><color rgb="FFD8DEE9"/></top><bottom style="thin"><color rgb="FFD8DEE9"/></bottom><diagonal/></border><border><left style="thin"><color rgb="FFFFFFFF"/></left><right style="thin"><color rgb="FFFFFFFF"/></right><top style="thin"><color rgb="FFFFFFFF"/></top><bottom style="thin"><color rgb="FFFFFFFF"/></bottom><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="7"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="2" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf><xf numFmtId="0" fontId="2" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf><xf numFmtId="0" fontId="3" fillId="0" borderId="1" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf><xf numFmtId="0" fontId="4" fillId="0" borderId="1" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf><xf numFmtId="0" fontId="5" fillId="0" borderId="1" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="center" vertical="top"/></xf><xf numFmtId="0" fontId="1" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf></cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

    const workbook = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Applications" sheetId="1" r:id="rId1"/></sheets></workbook>`;
    const workbookRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;
    const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`;
    const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`;

    return buildZipBuffer([
        { name: '[Content_Types].xml', data: Buffer.from(contentTypes, 'utf8') },
        { name: '_rels/.rels', data: Buffer.from(rels, 'utf8') },
        { name: 'xl/workbook.xml', data: Buffer.from(workbook, 'utf8') },
        { name: 'xl/_rels/workbook.xml.rels', data: Buffer.from(workbookRels, 'utf8') },
        { name: 'xl/styles.xml', data: Buffer.from(styles, 'utf8') },
        { name: 'xl/worksheets/sheet1.xml', data: Buffer.from(worksheet, 'utf8') },
        { name: 'xl/worksheets/_rels/sheet1.xml.rels', data: Buffer.from(worksheetRels, 'utf8') },
    ]);
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

function getPdfLogoImage() {
    const candidates = [
        path.join(__dirname, '..', '..', 'admin-panel', 'public', 'images', 'frontend-logo.png'),
        path.join(__dirname, '..', '..', 'frontend', 'public', 'Logo', 'Logo.png'),
    ];

    for (const logoPath of candidates) {
        try {
            if (fs.existsSync(logoPath)) {
                return decodePngForPdf(fs.readFileSync(logoPath));
            }
        } catch (error) {
            console.warn('Failed to load PDF logo:', logoPath, error.message);
        }
    }

    return null;
}

function decodePngForPdf(buffer) {
    const signature = buffer.slice(0, 8).toString('hex');
    if (signature !== '89504e470d0a1a0a') return null;

    let offset = 8;
    let width = 0;
    let height = 0;
    let bitDepth = 0;
    let colorType = 0;
    const idatParts = [];

    while (offset < buffer.length) {
        const length = buffer.readUInt32BE(offset);
        const type = buffer.slice(offset + 4, offset + 8).toString('ascii');
        const data = buffer.slice(offset + 8, offset + 8 + length);

        if (type === 'IHDR') {
            width = data.readUInt32BE(0);
            height = data.readUInt32BE(4);
            bitDepth = data[8];
            colorType = data[9];
        } else if (type === 'IDAT') {
            idatParts.push(data);
        } else if (type === 'IEND') {
            break;
        }

        offset += 12 + length;
    }

    if (!width || !height || bitDepth !== 8 || ![2, 6].includes(colorType)) return null;

    const bytesPerPixel = colorType === 6 ? 4 : 3;
    const inflated = zlib.inflateSync(Buffer.concat(idatParts));
    const stride = width * bytesPerPixel;
    const decoded = Buffer.alloc(width * height * bytesPerPixel);
    let sourceOffset = 0;
    let targetOffset = 0;
    let previous = Buffer.alloc(stride);

    function paethPredictor(left, up, upperLeft) {
        const p = left + up - upperLeft;
        const pa = Math.abs(p - left);
        const pb = Math.abs(p - up);
        const pc = Math.abs(p - upperLeft);
        if (pa <= pb && pa <= pc) return left;
        if (pb <= pc) return up;
        return upperLeft;
    }

    for (let row = 0; row < height; row += 1) {
        const filter = inflated[sourceOffset];
        sourceOffset += 1;
        const current = Buffer.alloc(stride);

        for (let index = 0; index < stride; index += 1) {
            const raw = inflated[sourceOffset + index];
            const left = index >= bytesPerPixel ? current[index - bytesPerPixel] : 0;
            const up = previous[index] || 0;
            const upperLeft = index >= bytesPerPixel ? previous[index - bytesPerPixel] : 0;

            if (filter === 0) current[index] = raw;
            else if (filter === 1) current[index] = (raw + left) & 0xff;
            else if (filter === 2) current[index] = (raw + up) & 0xff;
            else if (filter === 3) current[index] = (raw + Math.floor((left + up) / 2)) & 0xff;
            else if (filter === 4) current[index] = (raw + paethPredictor(left, up, upperLeft)) & 0xff;
            else throw new Error(`Unsupported PNG filter ${filter}`);
        }

        current.copy(decoded, targetOffset);
        previous = current;
        sourceOffset += stride;
        targetOffset += stride;
    }

    const pixels = width * height;
    const rgb = Buffer.alloc(pixels * 3);
    const alpha = colorType === 6 ? Buffer.alloc(pixels) : null;

    for (let pixel = 0; pixel < pixels; pixel += 1) {
        const source = pixel * bytesPerPixel;
        const target = pixel * 3;
        rgb[target] = decoded[source];
        rgb[target + 1] = decoded[source + 1];
        rgb[target + 2] = decoded[source + 2];
        if (alpha) alpha[pixel] = decoded[source + 3];
    }

    return {
        width,
        height,
        rgb: zlib.deflateSync(rgb),
        alpha: alpha ? zlib.deflateSync(alpha) : null,
    };
}
function buildPdfBuffer(applications) {
    const rows = getExportRows(applications);
    const objects = [];
    const pages = [];
    const width = 842;
    const height = 595;
    const margin = 30;
    const footerY = 22;
    const topY = 548;
    const rowHeight = 34;
    const headerHeight = 24;
    const tableTop = 474;
    const tableBottom = 54;
    const fonts = {
        regular: 3,
        bold: 4,
    };
    const logoImage = getPdfLogoImage();
    let logoImageId = null;
    let logoMaskId = null;
    const columns = [
        { label: '#', key: 'no', x: 30, w: 24, align: 'center' },
        { label: 'Candidate', key: 'name', x: 54, w: 88 },
        { label: 'Email', key: 'email', x: 142, w: 118 },
        { label: 'Phone', key: 'phone', x: 260, w: 72 },
        { label: 'Vacancy', key: 'vacancy', x: 332, w: 104 },
        { label: 'Department', key: 'department', x: 436, w: 82 },
        { label: 'Country', key: 'country', x: 518, w: 68 },
        { label: 'Exp.', key: 'experience', x: 586, w: 52 },
        { label: 'Education', key: 'education', x: 638, w: 65 },
        { label: 'CV', key: 'cvUrl', x: 703, w: 45, align: 'center' },
        { label: 'Applied', key: 'submittedAt', x: 748, w: 64 },
    ];

    function addObject(content) {
        objects.push(content);
        return objects.length;
    }

    function textWidth(value, fontSize) {
        return cleanText(value).length * fontSize * 0.48;
    }

    function truncateText(value, maxWidth, fontSize) {
        const text = cleanText(value);
        if (textWidth(text, fontSize) <= maxWidth) return text;
        let output = text;
        while (output.length > 0 && textWidth(`${output}...`, fontSize) > maxWidth) {
            output = output.slice(0, -1);
        }
        return `${output || text.slice(0, 1)}...`;
    }

    function linesForCell(value, maxWidth, fontSize, maxLines = 2) {
        const words = cleanText(value).split(' ').filter(Boolean);
        const lines = [];
        let current = '';

        words.forEach((word) => {
            const next = current ? `${current} ${word}` : word;
            if (textWidth(next, fontSize) > maxWidth && current) {
                lines.push(current);
                current = word;
            } else {
                current = next;
            }
        });
        if (current) lines.push(current);
        if (!lines.length) lines.push('');

        const clipped = lines.slice(0, maxLines);
        if (lines.length > maxLines) {
            clipped[maxLines - 1] = truncateText(clipped[maxLines - 1], maxWidth, fontSize);
        }
        return clipped;
    }

    function setColor(r, g, b) {
        return `${(r / 255).toFixed(3)} ${(g / 255).toFixed(3)} ${(b / 255).toFixed(3)} rg`;
    }

    function setStroke(r, g, b) {
        return `${(r / 255).toFixed(3)} ${(g / 255).toFixed(3)} ${(b / 255).toFixed(3)} RG`;
    }

    function rect(x, y, w, h, fill = true) {
        return `${x} ${y} ${w} ${h} re ${fill ? 'f' : 'S'}`;
    }

    function drawText(x, y, value, fontSize = 8, font = fonts.regular, color = [17, 24, 39]) {
        return [
            setColor(color[0], color[1], color[2]),
            `BT /F${font} ${fontSize} Tf 1 0 0 1 ${x} ${y} Tm (${pdfEscape(value)}) Tj ET`,
        ].join('\n');
    }

    function drawCenteredText(x, y, w, value, fontSize = 8, font = fonts.regular, color = [17, 24, 39]) {
        const display = truncateText(value, w - 6, fontSize);
        const tx = x + Math.max(3, (w - textWidth(display, fontSize)) / 2);
        return drawText(tx, y, display, fontSize, font, color);
    }

    function addPage(pageRows, pageNumber, totalPages) {
        const commands = [];
        const annotations = [];

        commands.push(setColor(184, 23, 37));
        commands.push(rect(0, 526, width, 69));
        if (logoImageId) {
            commands.push(setColor(255, 255, 255));
            commands.push(rect(margin - 6, 542, 138, 42));
            commands.push('q 120 0 0 41 34 543 cm /Logo Do Q');
            commands.push(drawText(178, 562, 'Job Applications Export', 14, fonts.bold, [255, 255, 255]));
        } else {
            commands.push(drawText(margin, 562, 'ACERO', 24, fonts.bold, [255, 255, 255]));
            commands.push(drawText(margin, 542, 'Job Applications Export', 14, fonts.bold, [255, 255, 255]));
        }
        commands.push(drawText(610, 562, `Generated: ${formatDateTime(new Date())}`, 8, fonts.regular, [255, 255, 255]));
        commands.push(drawText(610, 546, `Records: ${rows.length}`, 8, fonts.regular, [255, 255, 255]));
        commands.push(drawText(610, 530, `Page ${pageNumber} of ${totalPages}`, 8, fonts.regular, [255, 255, 255]));

        commands.push(setColor(248, 250, 252));
        commands.push(rect(margin, 492, width - margin * 2, 22));
        commands.push(drawText(margin + 10, 500, 'Filtered export from Acero CMS. CV cells are clickable when a CV URL is available.', 9, fonts.regular, [71, 85, 105]));

        commands.push(setColor(31, 41, 55));
        commands.push(rect(margin, tableTop, width - margin * 2, headerHeight));
        columns.forEach((column) => {
            commands.push(drawCenteredText(column.x, tableTop + 8, column.w, column.label, 7, fonts.bold, [255, 255, 255]));
        });

        let y = tableTop - rowHeight;
        pageRows.forEach((row, index) => {
            commands.push(setColor(index % 2 === 0 ? 255 : 248, index % 2 === 0 ? 255 : 250, index % 2 === 0 ? 255 : 252));
            commands.push(rect(margin, y, width - margin * 2, rowHeight));
            commands.push(setStroke(226, 232, 240));
            commands.push(rect(margin, y, width - margin * 2, rowHeight, false));

            columns.forEach((column) => {
                commands.push(setStroke(226, 232, 240));
                commands.push(rect(column.x, y, column.w, rowHeight, false));

                if (column.key === 'cvUrl') {
                    if (row.cvUrl) {
                        commands.push(drawCenteredText(column.x, y + 20, column.w, 'View', 7.2, fonts.bold, [37, 99, 235]));
                        annotations.push(`<< /Type /Annot /Subtype /Link /Rect [${column.x + 4} ${y + 15} ${column.x + column.w - 4} ${y + 27}] /Border [0 0 0] /A << /S /URI /URI (${pdfEscape(row.cvUrl)}) >> >>`);
                    } else {
                        commands.push(drawCenteredText(column.x, y + 20, column.w, '-', 7.2));
                    }
                    return;
                }

                const value = column.key === 'submittedAt' ? String(row.submittedAt || '').slice(0, 10) : row[column.key];
                const cellLines = linesForCell(value, column.w - 8, 7.2, 2);
                cellLines.forEach((line, lineIndex) => {
                    if (column.align === 'center') {
                        commands.push(drawCenteredText(column.x, y + 20 - lineIndex * 10, column.w, line, 7.2));
                    } else {
                        commands.push(drawText(column.x + 4, y + 20 - lineIndex * 10, truncateText(line, column.w - 8, 7.2), 7.2));
                    }
                });
            });

            y -= rowHeight;
        });

        commands.push(setColor(31, 41, 55));
        commands.push(rect(0, 0, width, 38));
        commands.push(drawText(margin, footerY, 'Copyright (c) 2026 Acero Building Systems. All rights reserved.', 9, fonts.regular, [255, 255, 255]));
        commands.push(drawText(width - 118, footerY, `Page ${pageNumber} of ${totalPages}`, 9, fonts.regular, [255, 255, 255]));

        const stream = commands.join('\n');
        const contentId = addObject(`<< /Length ${Buffer.byteLength(stream, 'utf8')} >>\nstream\n${stream}\nendstream`);
        const annotationIds = annotations.map((annotation) => addObject(annotation));
        const pageId = addObject('');
        const xObjects = logoImageId ? `/XObject << /Logo ${logoImageId} 0 R >>` : '';
        objects[pageId - 1] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Resources << /Font << /F${fonts.regular} ${fonts.regular} 0 R /F${fonts.bold} ${fonts.bold} 0 R >> ${xObjects} >> /Contents ${contentId} 0 R /Annots [${annotationIds.map((id) => `${id} 0 R`).join(' ')}] >>`;
        pages.push(pageId);
    }

    addObject('<< /Type /Catalog /Pages 2 0 R >>');
    addObject('');
    addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
    addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');

    if (logoImage) {
        if (logoImage.alpha) {
            logoMaskId = addObject(Buffer.concat([
                Buffer.from(`<< /Type /XObject /Subtype /Image /Width ${logoImage.width} /Height ${logoImage.height} /ColorSpace /DeviceGray /BitsPerComponent 8 /Filter /FlateDecode /Length ${logoImage.alpha.length} >>\nstream\n`, 'binary'),
                logoImage.alpha,
                Buffer.from('\nendstream', 'binary'),
            ]));
        }
        logoImageId = addObject(Buffer.concat([
            Buffer.from(`<< /Type /XObject /Subtype /Image /Width ${logoImage.width} /Height ${logoImage.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode ${logoMaskId ? `/SMask ${logoMaskId} 0 R` : ''} /Length ${logoImage.rgb.length} >>\nstream\n`, 'binary'),
            logoImage.rgb,
            Buffer.from('\nendstream', 'binary'),
        ]));
    }

    const rowsPerPage = Math.max(1, Math.floor((tableTop - tableBottom - headerHeight) / rowHeight));
    const pageGroups = [];
    for (let index = 0; index < rows.length; index += rowsPerPage) {
        pageGroups.push(rows.slice(index, index + rowsPerPage));
    }
    if (!pageGroups.length) pageGroups.push([]);

    pageGroups.forEach((pageRows, index) => {
        if (!pageRows.length) {
            pageRows.push({ no: '', name: 'No applications matched the selected filters.' });
        }
        addPage(pageRows, index + 1, pageGroups.length);
    });

    objects[1] = `<< /Type /Pages /Kids [${pages.map((id) => `${id} 0 R`).join(' ')}] /Count ${pages.length} >>`;

    const chunks = ['%PDF-1.4\n'];
    const offsets = [0];

    objects.forEach((object, index) => {
        offsets[index + 1] = Buffer.byteLength(chunks.join(''), 'binary');
        const body = Buffer.isBuffer(object) ? object.toString('binary') : object;
        chunks.push(`${index + 1} 0 obj\n${body}\nendobj\n`);
    });

    const xrefOffset = Buffer.byteLength(chunks.join(''), 'binary');
    chunks.push(`xref\n0 ${objects.length + 1}\n`);
    chunks.push('0000000000 65535 f \n');
    for (let i = 1; i <= objects.length; i += 1) {
        chunks.push(`${String(offsets[i]).padStart(10, '0')} 00000 n \n`);
    }
    chunks.push(`trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);

    return Buffer.from(chunks.join(''), 'binary');
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
            getExportFilename('excel', 'xlsx'),
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
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
