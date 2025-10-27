import loggerFunc from "../views/logger.js";
import createSignalingChannel from "./channel_with_name.js";
import createDataChannel from "./webrtc_channel_server.js";
import {makeQrStr, removeElem} from "../views/qr_helper.js";
import JSONCrush from "jsoncrush";
import scanBarcode from "../views/barcode.js";
import {delayReject} from "../utils/timer.js";
import {netObj} from "../../../index.js";
import {broad_chan_to_actions} from "./chan_to_sender.js";
import {unsubscribe} from "./rtc_common_chan.js";

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

function showQr(window, document, settings, dataToSend, logger) {
    const urlWithoutParams = netObj.getHostUrl(settings, window.location);
    const baseUrl = urlWithoutParams;
    let url4 = baseUrl;
    if (dataToSend) {
        const jsonString = JSON.stringify(dataToSend);
        const encoded3 = JSONCrush.crush(jsonString);
        const encoded4 = window.encodeURIComponent(encoded3);
        url4 = baseUrl + "?z=" + encoded4;
    } else {
        logger.log("No data", dataToSend);
    }
    const qr = makeQrStr(url4, window, document, settings);
    return qr;
}

async function connectDataAndSigServer(dataChan, sigChannelPromise, dataToSendPromise, logger, id) {
    const signalingChan = await sigChannelPromise;
    let clientId = null;
    const actions = {
        "offer_and_cand": (data) => {
            logger.log("offerCand", data);
            dataChan.resolveExternal(data.data);
            return Promise.race([dataChan.ready(), delayReject(20000)]).catch(() => {
                if (clientId != null) {
                    signalingChan.send("stop_waiting", {}, clientId);
                }
                dataChan.close("timeout7");
            });
        },
        "join": async (data) => {
            logger.log("onJoin", data);
            clientId ??= data.from;
            if (clientId === data.from) {
                const dataToSend = await dataToSendPromise;
                signalingChan.send("offer_and_cand", dataToSend, clientId);
            }
        }
    };
    const unsubscribe = broad_chan_to_actions(signalingChan, actions, logger, false, id);
    return unsubscribe;
}

export async function server_chan(myId, window, document, settings) {
    const mainLogger = loggerFunc(document, settings, 2, null, "mainServer");

    const signalingLogger = loggerFunc(document, settings, 1);
    const sigChannelPromise = Promise.race([
        createSignalingChannel(myId, myId, window.location, settings, signalingLogger),
        delayReject(5000)
    ]).catch(() => null);
    const dataChanLogger = loggerFunc(document, settings, 3);
    const dataChan = createDataChannel(myId, dataChanLogger);
    const dataToSendPromise = dataChan.getDataToSend();
    const unsubPromise = connectDataAndSigServer(dataChan,
        sigChannelPromise, dataToSendPromise, signalingLogger, myId);

    let commChan = null;
    try {
        const dataToSend = await dataToSendPromise;
        const qr = showQr(window, document, settings, dataToSend, mainLogger);
        showReadBtn(window, document, mainLogger).then((answerAndCand) => {
            mainLogger.log("decoded", answerAndCand);
            dataChan.resolveExternal(answerAndCand);
        }).catch(err => {
            mainLogger.error(err);
        });
        await dataChan.processAns();
        mainLogger.log("Ans setted");
        await dataChan.ready();
        mainLogger.log("Chan ready");
        removeElem(qr);
        commChan = dataChan;
    } catch (err) {
        mainLogger.error(err);
        const sigChan = await sigChannelPromise;
        if (sigChan) {
            await sigChan.ready();
        }
        commChan = sigChan;
    } finally {
        unsubscribe(unsubPromise);
    }
    return commChan;
}
