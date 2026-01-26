/**
 * YouTube utility functions
 * Handles YouTube URL parsing and thumbnail fetching
 */

/**
 * Extract YouTube video ID from various YouTube URL formats
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://youtube.com/embed/VIDEO_ID
 */
function extractYouTubeId(url) {
    if (!url || typeof url !== 'string') {
        return null;
    }

    // Remove whitespace
    url = url.trim();

    // Pattern 1: youtube.com/watch?v=VIDEO_ID
    let match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    if (match && match[1]) {
        return match[1];
    }

    // Pattern 2: youtube.com/v/VIDEO_ID
    match = url.match(/youtube\.com\/v\/([a-zA-Z0-9_-]{11})/);
    if (match && match[1]) {
        return match[1];
    }

    // Pattern 3: Direct video ID (11 characters)
    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
        return url;
    }

    return null;
}

/**
 * Get YouTube thumbnail URL from video ID
 * Quality options: default, mqdefault, hqdefault, sddefault, maxresdefault
 */
function getYouTubeThumbnail(videoId, quality = 'hqdefault') {
    if (!videoId) {
        return null;
    }

    const qualities = ['default', 'mqdefault', 'hqdefault', 'sddefault', 'maxresdefault'];
    if (!qualities.includes(quality)) {
        quality = 'hqdefault';
    }

    return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
}

/**
 * Validate YouTube URL
 */
function isValidYouTubeUrl(url) {
    if (!url || typeof url !== 'string') {
        return false;
    }

    const patterns = [
        /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/.+/,
        /^[a-zA-Z0-9_-]{11}$/ // Direct video ID
    ];

    return patterns.some(pattern => pattern.test(url.trim()));
}

/**
 * Normalize YouTube URL to standard format
 */
function normalizeYouTubeUrl(url) {
    const videoId = extractYouTubeId(url);
    if (!videoId) {
        return null;
    }

    return `https://www.youtube.com/watch?v=${videoId}`;
}

module.exports = {
    extractYouTubeId,
    getYouTubeThumbnail,
    isValidYouTubeUrl,
    normalizeYouTubeUrl
};
