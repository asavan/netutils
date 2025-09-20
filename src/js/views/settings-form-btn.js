import createBooleanForm from "./settings-form.js";
import fullScreen from "./fullscreen.js";

export default function addSettingsButton(document, settings) {
    const maxBtn = document.querySelector("#maximize-btn");
    const resizeBtn = document.querySelector("#resize-btn");
    const qrBtn = document.querySelector(".qr-btn");
    let formInstance = null;
    if (settings.mode === "server" || settings.mode === "swrtc" || settings.mode === "ssupa") {
        resizeBtn.classList.add("hidden");
        maxBtn.classList.remove("hidden");
        qrBtn.classList.remove("hidden");
    } else {
        resizeBtn.classList.remove("hidden");
        maxBtn.classList.add("hidden");
        qrBtn.classList.add("hidden");
        fullScreen(document, resizeBtn);
    }

    maxBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const controlPanel = document.querySelector("#control-panel");
        if (formInstance) {
            controlPanel.classList.add("minimized");
            formInstance.destroy();
            formInstance = null;
        } else {
            controlPanel.classList.remove("minimized");
            formInstance = createBooleanForm(settings);
            formInstance.appendTo(".panel-content");
        }
    });
}
