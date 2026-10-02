let authToken = null;

export function setAccessToken(token) {
  authToken = token;
}

export function getAccessToken() {
  return authToken;
}

export function clearAccessToken() {
  authToken = null;
}