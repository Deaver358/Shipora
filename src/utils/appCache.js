const memoryCache = new Map();

const DEFAULT_TTL = 5 * 60 * 1000;

function getStorageKey(key) {
  return `shipora_cache_${key}`;
}

export function getCached(key) {
  if (!key) return null;

  const now = Date.now();

  const memoryEntry = memoryCache.get(key);

  if (memoryEntry) {
    if (now - memoryEntry.timestamp <= memoryEntry.ttl) {
      return memoryEntry.data;
    }

    memoryCache.delete(key);
  }

  try {
    const stored = sessionStorage.getItem(getStorageKey(key));

    if (!stored) {
      return null;
    }

    const parsed = JSON.parse(stored);

    if (
      !parsed ||
      typeof parsed !== "object" ||
      !("data" in parsed) ||
      !parsed.timestamp
    ) {
      sessionStorage.removeItem(getStorageKey(key));
      return null;
    }

    const ttl = parsed.ttl || DEFAULT_TTL;

    if (now - parsed.timestamp > ttl) {
      sessionStorage.removeItem(getStorageKey(key));
      return null;
    }

    memoryCache.set(key, {
      data: parsed.data,
      timestamp: parsed.timestamp,
      ttl,
    });

    return parsed.data;
  } catch {
    return null;
  }
}

export function setCached(key, data, ttl = DEFAULT_TTL) {
  if (!key || data === undefined) return;

  const entry = {
    data,
    timestamp: Date.now(),
    ttl,
  };

  memoryCache.set(key, entry);

  try {
    sessionStorage.setItem(
      getStorageKey(key),
      JSON.stringify(entry)
    );
  } catch {
    // Ignore storage errors.
  }
}

export function updateCached(key, updates, ttl = DEFAULT_TTL) {
  const current = getCached(key);

  if (!current || typeof current !== "object") {
    return;
  }

  setCached(
    key,
    {
      ...current,
      ...updates,
    },
    ttl
  );
}

export function clearCached(key) {
  if (!key) return;

  memoryCache.delete(key);

  try {
    sessionStorage.removeItem(getStorageKey(key));
  } catch {
    // Ignore storage errors.
  }
}

export function clearAllCache() {
  memoryCache.clear();

  try {
    const keysToRemove = [];

    for (let index = 0; index < sessionStorage.length; index += 1) {
      const key = sessionStorage.key(index);

      if (key?.startsWith("shipora_cache_")) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => {
      sessionStorage.removeItem(key);
    });
  } catch {
    // Ignore storage errors.
  }
}

export function hasCached(key) {
  return getCached(key) !== null;
}
