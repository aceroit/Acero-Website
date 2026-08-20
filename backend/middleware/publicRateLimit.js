const { errorResponse } = require('../utils/responseFormatter');

const DEFAULT_CLEANUP_INTERVAL_MS = 60 * 1000;

function getClientIp(req) {
    const forwardedFor = req.headers['x-forwarded-for'];

    if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
        return forwardedFor.split(',')[0].trim();
    }

    return (
        req.ip ||
        req.connection?.remoteAddress ||
        req.socket?.remoteAddress ||
        req.connection?.socket?.remoteAddress ||
        'unknown'
    );
}

// Lightweight in-memory limiter for public submit endpoints. It protects local
// and single-instance Hostinger deployments from repeated form submissions.
// For multi-server hosting, replace the Map with Redis or another shared store.
function createRateLimitMiddleware({
    windowMs,
    maxRequests,
    keyPrefix,
    message,
    skipSuccessfulRequests = false
}) {
    if (!windowMs || !maxRequests || !keyPrefix) {
        throw new Error('createRateLimitMiddleware requires windowMs, maxRequests, and keyPrefix');
    }

    const requestLog = new Map();

    setInterval(() => {
        const now = Date.now();

        for (const [key, timestamps] of requestLog.entries()) {
            const validTimestamps = timestamps.filter((timestamp) => now - timestamp < windowMs);

            if (validTimestamps.length === 0) {
                requestLog.delete(key);
                continue;
            }

            requestLog.set(key, validTimestamps);
        }
    }, DEFAULT_CLEANUP_INTERVAL_MS).unref();

    return (req, res, next) => {
        const now = Date.now();
        const clientIp = getClientIp(req);
        const key = `${keyPrefix}:${clientIp}`;
        const timestamps = (requestLog.get(key) || []).filter((timestamp) => now - timestamp < windowMs);

        if (timestamps.length >= maxRequests) {
            const oldestTimestamp = timestamps[0];
            const retryAfterSeconds = Math.max(1, Math.ceil((windowMs - (now - oldestTimestamp)) / 1000));

            res.set('Retry-After', String(retryAfterSeconds));

            return errorResponse(
                res,
                429,
                message || 'Too many requests. Please try again later.'
            );
        }

        timestamps.push(now);
        requestLog.set(key, timestamps);

        if (skipSuccessfulRequests) {
            const originalJson = res.json.bind(res);

            res.json = (body) => {
                if (res.statusCode < 400) {
                    const current = requestLog.get(key) || [];
                    const index = current.indexOf(now);

                    if (index >= 0) {
                        current.splice(index, 1);
                    }

                    if (current.length === 0) {
                        requestLog.delete(key);
                    } else {
                        requestLog.set(key, current);
                    }
                }

                return originalJson(body);
            };
        }

        next();
    };
}

const enquiryRateLimit = createRateLimitMiddleware({
    windowMs: 10 * 60 * 1000,
    maxRequests: 5,
    keyPrefix: 'public-enquiry',
    message: 'Too many enquiry submissions from this IP. Please try again after 10 minutes.'
});

const getQuoteRateLimit = createRateLimitMiddleware({
    windowMs: 10 * 60 * 1000,
    maxRequests: 5,
    keyPrefix: 'public-get-quote',
    message: 'Too many quote requests from this IP. Please try again after 10 minutes.'
});

const applicationRateLimit = createRateLimitMiddleware({
    windowMs: 30 * 60 * 1000,
    maxRequests: 3,
    keyPrefix: 'public-application',
    message: 'Too many job applications from this IP. Please try again after 30 minutes.'
});

const uploadCvRateLimit = createRateLimitMiddleware({
    windowMs: 30 * 60 * 1000,
    maxRequests: 5,
    keyPrefix: 'public-upload-cv',
    message: 'Too many CV uploads from this IP. Please try again after 30 minutes.'
});

module.exports = {
    createRateLimitMiddleware,
    enquiryRateLimit,
    getQuoteRateLimit,
    applicationRateLimit,
    uploadCvRateLimit,
    getClientIp
};
