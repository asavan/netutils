import createFormBinder2 from "./formbinder_v2.js";
import {toggleFullScreen} from "./fullscreen.js";

export function addButton(window, document, symbol, title, callback, additionalClasses = []) {
    const parent = document.querySelector(".menu > .control-panel > .panel-header");
    if (!parent) {
        return;
    }
    const btn = document.createElement("button");
    btn.classList.add("contrl-btn");
    for (const cl of additionalClasses) {
        btn.classList.add(cl);
    }
    btn.textContent = symbol;
    btn.title = title;
    parent.appendChild(btn);
    btn.addEventListener("click", e => {
        e.preventDefault();
        callback();
    });
    return btn;
}

export function addLoggerBtn(window, document) {
    addButton(window, document, "≣", "logger", () => {
        const logger = document.querySelector(".log");
        if (!logger) {
            return;
        }
        logger.classList.toggle("hidden");
    });
}

export function addFullScreenBtn(window, document) {
    if (!document.exitFullscreen) {
        return;
    }
    addButton(window, document, "⤱", "fullscreen", () => {
        const body = document.querySelector("body");
        toggleFullScreen(document, body);
    });
}

export function addSettingsBtn(window, document, settings) {
    let formInstance = null;
    addButton(window, document, "⚙", "Maximize Panel", () => {
        const controlPanel = document.querySelector(".menu > .control-panel");
        if (formInstance) {
            controlPanel.classList.add("minimized");
            formInstance.remove();
            formInstance = null;
        } else {
            controlPanel.classList.remove("minimized");
            formInstance = createFormBinder2(settings, document);
            const anchor = document.querySelector(".panel-content");
            anchor.appendChild(formInstance);
        }
    });
}

export function addServerBtns(window, document, settings) {
    addLoggerBtn(window, document);
    addSettingsBtn(window, document, settings);
}
