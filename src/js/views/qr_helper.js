import {QRCodeSVG} from "@akamfoad/qrcode";

export function bigPicture(elem) {
    elem.addEventListener("click", () => elem.classList.toggle("big"));
}

async function writeClipboardText(text) {
    try {
        if (navigator.clipboard) {
            await navigator.clipboard.writeText(text);
        }
    } catch (error) {
        console.error(error.message);
    }
}

function shareAndCopy(elem, url) {
    const shareData = {
        title: "Sos game",
        url: url,
    };
    elem.addEventListener("dblclick", async () => {
        await writeClipboardText(url);
        try {
            if (navigator.share && navigator.maxTouchPoints > 1) {
                await navigator.share(shareData);
            }
        } catch (err) {
            console.error(err);
        }
    });
}

function chomp(string, c) {
    if (string.endsWith(c)) {
        return string.slice(0, -c.length);
    }
    return string;
}

function renderQRCodeSVG(text, divElement, image) {
    const options = {
        level: "M",
        padding: 3,
    };
    if (text.length < 100 && image) {
        options.image = image;
    }
    const qrSVG = new QRCodeSVG(text, options);
    divElement.innerHTML = qrSVG.toString();
}

export function removeElem(el) {
    if (el) {
        el.remove();
    }
}

export function makeQrString(window, settings) {
    const staticHost = settings.sh || (window.location.origin + window.location.pathname);
    const url = new URL(staticHost);
    if (settings.seed) {
        url.searchParams.set("seed", settings.seed);
    }
    const urlStr = chomp(url.toString(), "/");
    return urlStr;
}

export function makeQrElement(urlStr, el, image) {
    console.log("enemy url", urlStr, urlStr.length);
    renderQRCodeSVG(urlStr, el, image);
    // bigPicture(el);
    shareAndCopy(el, urlStr);
    bigPicture(el);
    return el;
}

export function makeQrStr(str, window, document, settings, image) {
    const el = document.querySelector(".qrcontainer");
    const divToRender = document.createElement("div");
    divToRender.classList.add("qrcode");
    el.append(divToRender);
    return makeQrElement(str, el, image);
}

export function makeQr(window, document, settings, image) {
    return makeQrStr(makeQrString(window, settings), window, document, settings, image);
}
