let authToken = null;

export function setAccessToken (token: string) {
    authToken = token;
}

export function getAccessToken () {
    return authToken;
}

export function clearAccessToken () {
    authToken = null;
}