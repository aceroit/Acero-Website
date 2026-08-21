const GoogleReCaptcha = require('../models/GoogleReCaptcha');

const VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';
const DEFAULT_MIN_SCORE = 0.5;

function getActiveFieldValue(field) {
    if (!field || field.isFieldActive === false) {
        return null;
    }

    return field.value;
}

function getRecaptchaToken(req) {
    const body = req.body || {};

    return (
        body.recaptchaToken ||
        body.captchaToken ||
        body['g-recaptcha-response'] ||
        null
    );
}

function shouldVerify(config) {
    if (!config) {
        return false;
    }

    return config.enabled?.isFieldActive !== false && config.enabled?.value !== false;
}

async function verifyWithGoogle(secretKey, token, remoteIp) {
    const body = new URLSearchParams({
        secret: secretKey,
        response: token,
    });

    if (remoteIp) {
        body.append('remoteip', remoteIp);
    }

    const response = await fetch(VERIFY_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
    });

    if (!response.ok) {
        throw new Error(`Google reCAPTCHA verification failed with HTTP ${response.status}`);
    }

    return response.json();
}

async function verifyRecaptchaForRequest(req, expectedAction) {
    const config = await GoogleReCaptcha.getPublished();

    if (!shouldVerify(config)) {
        return { success: true, skipped: true };
    }

    const secretKey = getActiveFieldValue(config.secretKey);
    if (!secretKey) {
        return {
            success: false,
            message: 'Captcha is not configured correctly. Please contact the website administrator.',
        };
    }

    const token = getRecaptchaToken(req);
    if (!token) {
        return {
            success: false,
            message: 'Captcha verification is required. Please refresh the page and try again.',
        };
    }

    try {
        const result = await verifyWithGoogle(secretKey, token, req.ip || req.connection?.remoteAddress);
        const version = getActiveFieldValue(config.version) || 'v3';

        if (!result.success) {
            return {
                success: false,
                message: 'Captcha verification failed. Please refresh the page and try again.',
                errors: result['error-codes'],
            };
        }

        if (version === 'v3') {
            const score = typeof result.score === 'number' ? result.score : 0;
            if (score < DEFAULT_MIN_SCORE) {
                return {
                    success: false,
                    message: 'Captcha verification failed. Please try again after a few minutes.',
                    score,
                };
            }

            if (expectedAction && result.action && result.action !== expectedAction) {
                return {
                    success: false,
                    message: 'Captcha verification failed. Please refresh the page and try again.',
                    action: result.action,
                };
            }
        }

        return {
            success: true,
            score: result.score,
            action: result.action,
        };
    } catch (error) {
        console.error('Error verifying Google reCAPTCHA:', error.message);
        return {
            success: false,
            message: 'Captcha verification could not be completed. Please try again.',
        };
    }
}

module.exports = {
    verifyRecaptchaForRequest,
};
