export function setupMedia() {
    if (navigator.mediaDevices) {
        return navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true
        });
    } else {
        console.log("No mediaDevices");
    }
}
