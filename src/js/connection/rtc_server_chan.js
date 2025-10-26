import loggerFunc from "../views/logger.js";
import createSignalingChannel from "./channel_with_name.js";
import createDataChannel from "./webrtc_channel_server.js";
import {makeQrStr, removeElem} from "../views/qr_helper.js";
import JSONCrush from "jsoncrush";
import scanBarcode from "../views/barcode.js";
import {delayReject} from "../utils/timer.js";
import {netObj} from "../../../index.js";

function showReadBtn(window, document, logger) {
    const barCodeReady = Promise.withResolvers();
    const qrBtn = document.querySelector(".qr-btn");
    qrBtn.classList.remove("hidden");
    qrBtn.addEventListener("click", async () => {
        let codes = await scanBarcode(window, document, logger);
        logger.log("codes1", codes);
        if (!codes) {
            const sign = prompt("Get code from qr");
            if (sign == null) {
                barCodeReady.reject();
                return;
            }
            codes = sign;
        }
        const decode = JSONCrush.uncrush(codes);
        barCodeReady.resolve(JSON.parse(decode));
    });

    return barCodeReady.promise;
}

function showQr(window, document, settings, dataToSend) {
    const urlWithoutParams = netObj.getHostUrl(settings, window.location);
    const baseUrl = urlWithoutParams;
    let url4 = baseUrl;
    if (dataToSend) {
        const jsonString = JSON.stringify(dataToSend);
        const encoded3 = JSONCrush.crush(jsonString);
        const encoded4 = window.encodeURIComponent(encoded3);
        url4 = baseUrl + "?z=" + encoded4;
    } else {
        console.log("No data", dataToSend);
    }
    const qr = makeQrStr(url4, window, document, settings);
    return qr;
}

export async function server_chan(myId, window, document, settings) {
    const mainLogger = loggerFunc(document, settings, 2, null, "mainServer");

    const signalingLogger = loggerFunc(document, settings, 1);
    const gameChannelPromise = Promise.race([
        createSignalingChannel(myId, myId, window.location, settings, signalingLogger),
        delayReject(5000)
    ]).catch(() => null);
    const dataChanLogger = loggerFunc(document, settings, 3);
    const dataChan = createDataChannel(myId, dataChanLogger);
    const dataToSend = await dataChan.getDataToSend();
    const qr = showQr(window, document, settings, dataToSend);
    showReadBtn(window, document, mainLogger).then((answerAndCand) => {
        mainLogger.log("decoded", answerAndCand);
        dataChan.resolveExternal(answerAndCand);
    }).catch(err => {
        mainLogger.error(err);
    });
    const sigChan = await gameChannelPromise;
    if (sigChan) {
        dataChan.setupChan(sigChan);
    }
    await dataChan.processAns();
    mainLogger.log("Ans setted");
    await dataChan.ready();
    mainLogger.log("Chan ready");

    removeElem(qr);
    return dataChan;
}
