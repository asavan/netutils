import loggerFunc from "../views/logger.js";
import createSignalingChannel from "./channel_with_name.js";
import createDataChannel from "./webrtc_channel_server.js";
import {makeQrStr, removeElem} from "../views/qr_helper.js";
import scanBarcode from "../views/barcode.js";
import LZString from "../../../node_modules/lz-string/libs/lz-string.js";
import {delayReject} from "../utils/timer.js";

function showReadBtn(window, document, logger) {
    const barCodeReady = Promise.withResolvers();
    const qrBtn = document.querySelector(".qr-btn");
    qrBtn.classList.remove("hidden");
    qrBtn.addEventListener("click", async () => {
        let codes = await scanBarcode(window, document, logger);
        logger.log(codes);
        if (!codes) {
            const sign = prompt("Get code from qr");
            if (sign == null) {
                barCodeReady.reject();
                return;
            }
            codes = sign;
        }
        const decode = LZString.decompressFromEncodedURIComponent(codes);
        barCodeReady.resolve(JSON.parse(decode));
    });

    return barCodeReady.promise;
}

function showQr(window, document, settings, dataToSend) {
    const currentUrl = new URL(window.location.href);
    const urlWithoutParams = currentUrl.origin + currentUrl.pathname;
    const baseUrl = urlWithoutParams;
    const jsonString = JSON.stringify(dataToSend);
    const encoded2 = LZString.compressToEncodedURIComponent(jsonString);
    const url2 = baseUrl + "?z=" + encoded2;
    const qr = makeQrStr(url2, window, document, settings);
    return qr;
}

export async function server_chan(myId, window, document, settings) {
    const mainLogger = loggerFunc(document, settings);

    const signalingLogger = loggerFunc(document, settings, 1);
    const gameChannelPromise = createSignalingChannel(myId, myId, window.location, settings, signalingLogger);
    const sigChan = await Promise.race([gameChannelPromise, delayReject(5000)]).catch(() => null);
    const dataChanLogger = loggerFunc(document, settings, 1);
    const dataChan = createDataChannel(myId, dataChanLogger);
    const dataToSend = await dataChan.getDataToSend();
    const qr = showQr(window, document, dataToSend);
    showReadBtn(window, document, mainLogger).then((answerAndCand) => {
        mainLogger.log(answerAndCand);
        dataChan.resolveExternal(answerAndCand);
    }).catch(err => {
        mainLogger.error(err);
    });
    if (sigChan) {
        await dataChan.setupChan(sigChan);
    }
    await dataChan.processAns();
    await dataChan.ready();

    removeElem(qr);
    return dataChan;
}
