const PROFILE_CACHE_KEY = "shipora_profile_cache";
const PROFILE_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

let memoryProfile = null;

export function getCachedProfile() {
  if (memoryProfile) {
    return memoryProfile;
  }

  try {
    const stored = sessionStorage.getItem(PROFILE_CACHE_KEY);

    if (!stored) {
      return null;
    }

    const parsed = JSON.parse(stored);

    if (!parsed?.data || !parsed?.timestamp) {
      sessionStorage.removeItem(PROFILE_CACHE_KEY);
      return null;
    }

    if (Date.now() - parsed.timestamp > PROFILE_CACHE_TTL) {
      sessionStorage.removeItem(PROFILE_CACHE_KEY);
      return null;
    }

    memoryProfile = parsed.data;
    return memoryProfile;
  } catch {
    return null;
  }
}

export function setCachedProfile(profile) {
  if (!profile) return;

  memoryProfile = profile;

  try {
    sessionStorage.setItem(
      PROFILE_CACHE_KEY,
      JSON.stringify({
        data: profile,
        timestamp: Date.now(),
      })
    );
  } catch {
    // Ignore storage errors.
  }
}

export function updateCachedProfile(updates) {
  const current = getCachedProfile();

  if (!current) return;

  setCachedProfile({
    ...current,
    ...updates,
  });
}

export function clearCachedProfile() {
  memoryProfile = null;

  try {
    sessionStorage.removeItem(PROFILE_CACHE_KEY);
  } catch {
    // Ignore storage errors.
  }
}