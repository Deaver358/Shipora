export function setAccessToken(uid, token) {
    sessionStorage.setItem(uid, token);
}

export function getAccessToken(uid) {
    return sessionStorage.getItem(uid);
}

export function clearAccessToken(uid) {
    sessionStorage.removeItem(uid);
}
