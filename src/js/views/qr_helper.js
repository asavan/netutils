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
    elem.addEventListener("click", async () => {
        await writeClipboardText(url);
    });
    if (navigator.share && navigator.maxTouchPoints > 1) {
        const shareData = {
            title: "Game",
            url: url,
        };
        elem.addEventListener("dblclick", async () => {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.error(err);
            }
        });
    }
}

export function chomp(string, c) {
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

export function makeQrElement(urlStr, el, image) {
    // urlStr = chomp(urlStr, "/");
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
    return makeQrElement(str, divToRender, image);
}
