function toggleFullScreen(document, elem) {
    if (!document.fullscreenElement) {
        // If the document is not in full screen mode
        // make the video full screen
        elem.requestFullscreen();
    } else {
        // Otherwise exit the full screen
        document.exitFullscreen?.();
    }
}

export default function fullScreen(document, el) {
    if (!el) {
        return;
    }
    const body = document.querySelector("body");
    el.addEventListener("click", (e) => {
        e.preventDefault();
        toggleFullScreen(document, body);
    });
}
