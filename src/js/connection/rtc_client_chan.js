import loggerFunc from "../views/logger.js";
import createDataChannelClient from "./webrtc_channel_client.js";
import createSignalingChannel from "./channel_with_name.js";
import {delayReject} from "../utils/timer.js";

import {makeQrStr, removeElem} from "../views/qr_helper.js";
import JSONCrush from "jsoncrush";

function showQr(window, document, settings, dataToSend, logger) {
    const jsonString = JSON.stringify(dataToSend);
    // const encoded2 = LZString.compressToEncodedURIComponent(jsonString);
    const encoded3 = JSONCrush.crush(jsonString);
    // const encoded4 = window.encodeURIComponent(encoded3);
    const qr = makeQrStr(encoded3, window, document, settings);
    logger.log(qr);
    return qr;
}

function clientOfferPromise(window, offerPromise) {
    const queryString = window.location.search;
    const urlParams = new window.URLSearchParams(queryString);
    const connectionStr = urlParams.get("z");
    if (!connectionStr) {
        return;
    }
    const offerAndCandidatesStr = JSONCrush.uncrush(connectionStr);
    const offerAndCandidates = JSON.parse(offerAndCandidatesStr);
    const url = new URL(window.location.href);
    url.searchParams.delete("z");
    history.replaceState({}, document.title, url.href);
    offerPromise.resolve(offerAndCandidates);
}


export async function client_chan(myId, window, document, settings) {
    const mainLogger = loggerFunc(document, settings, 2, null, "mainLog");
    const offerPromise = Promise.withResolvers();
    clientOfferPromise(window, offerPromise);
    let serverId = await Promise.race([offerPromise.promise, Promise.resolve(null)]).then(data => data?.id);
    if (!serverId) {
        serverId = settings.serverId;
    }
    mainLogger.log("maybe server " + serverId);
    const signalingLogger = loggerFunc(document, settings, 1);
    const gameChannelPromise = createSignalingChannel(myId, serverId, window.location, settings, signalingLogger);
    const sigChan = await Promise.race([gameChannelPromise, delayReject(5000)]).catch(() => null);
    const dataChanLogger = loggerFunc(document, settings, 3);
    const dataChan = createDataChannelClient(myId, dataChanLogger);
    const qrLogger = loggerFunc(document, settings, 1);
    const dataToSend = await dataChan.connect(offerPromise, sigChan);
    const qr = showQr(window, document, settings, dataToSend, qrLogger);
    await dataChan.ready();
    removeElem(qr);
    return dataChan;
}
