import rngFunc from "./random.js";

function setupMedia() {
    if (navigator.mediaDevices) {
        navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true
        });
    } else {
        console.log("No mediaDevices");
    }
}

function getMyId(window, settings, rngEngine) {
    const name = settings.idNameInStorage || "my-id";
    const data = window.sessionStorage.getItem(name);
    if (data) {
        return data;
    }
    const len = settings.idNameLen || 6;
    const newId = rngFunc.makeId(len, rngEngine);
    window.sessionStorage.setItem(name, newId);
    return newId;
}

function getWebSocketUrl(settings, location) {
    if (settings.wh) {
        return settings.wh;
    }
    if (location.protocol === "https:") {
        return;
    }
    return "ws://" + location.hostname + ":" + settings.wsPort;
}

function getHostUrl(settings, location) {
    if (settings.sh) {
        return settings.sh;
    }
    const urlWithoutParams = location.origin + location.pathname;
    return urlWithoutParams;
}

export default {
    getMyId,
    setupMedia,
    getHostUrl,
    getWebSocketUrl
};
