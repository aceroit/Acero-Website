const publicCache = new Map();

function getPublicCache(key) {
    const cached = publicCache.get(key);

    if (!cached) {
        return {
            status: 'MISS',
            data: null
        };
    }

    const now = Date.now();

    if (now <= cached.freshUntil) {
        return {
            status: 'HIT',
            data: cached.data
        };
    }

    if (now <= cached.staleUntil) {
        return {
            status: 'STALE',
            data: cached.data
        };
    }

    publicCache.delete(key);

    return {
        status: 'MISS',
        data: null
    };
}

function setPublicCache(key, data, freshTtlMs = 2 * 60 * 1000, staleTtlMs = 30 * 60 * 1000) {
    const now = Date.now();

    publicCache.set(key, {
        data,
        freshUntil: now + freshTtlMs,
        staleUntil: now + staleTtlMs,
        isRefreshing: false
    });
}

async function refreshPublicCacheInBackground(key, fetchData, freshTtlMs, staleTtlMs) {
    const cached = publicCache.get(key);

    if (cached && cached.isRefreshing) {
        return;
    }

    if (cached) {
        cached.isRefreshing = true;
    }

    try {
        const freshData = await fetchData();
        setPublicCache(key, freshData, freshTtlMs, staleTtlMs);
        console.log(`[Public Cache] Refreshed: ${key}`);
    } catch (error) {
        console.error(`[Public Cache] Background refresh failed: ${key}`, error);

        if (cached) {
            cached.isRefreshing = false;
        }
    }
}

function clearPublicCache(reason = '') {
    publicCache.clear();
    if (reason) {
        console.log(`[Public Cache] Cleared: ${reason}`);
    }
}

module.exports = {
    getPublicCache,
    setPublicCache,
    refreshPublicCacheInBackground,
    clearPublicCache,
};
