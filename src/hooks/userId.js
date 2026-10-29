export const setCurrendUid = (uid) => {
    sessionStorage.setItem("uid", uid);
}

export const getCurrentUid = () => {
    return sessionStorage.getItem("uid");
}

export const clearCurrentUid = () => {
    sessionStorage.removeItem("uid");
}
