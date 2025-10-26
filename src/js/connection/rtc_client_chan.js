import loggerFunc from "../views/logger.js";
import createDataChannelClient from "./webrtc_channel_client.js";
import createSignalingChannel from "./channel_with_name.js";
import {delayReject} from "../utils/timer.js";

import {makeQrStr, removeElem} from "../views/qr_helper.js";
import JSONCrush from "jsoncrush";
import {broad_chan_to_actions} from "./chan_to_sender.js";

function showQr(window, document, settings, dataToSend, logger) {
    const jsonString = JSON.stringify(dataToSend);
    // const encoded2 = LZString.compressToEncodedURIComponent(jsonString);
    const encoded3 = JSONCrush.crush(jsonString);
    // const encoded4 = window.encodeURIComponent(encoded3);
    const qr = makeQrStr(encoded3, window, document, settings);
    logger.log(qr);
    return qr;
}

export function clientOfferPromise(window, offerPromise) {
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

async function connectDataAndSig(dataChan, sigChannelPromise, offerPromiseWithResolvers, logger, id) {
    logger.log("client connect");
    const signalingChan = await sigChannelPromise;
    if (!signalingChan) {
        logger.log("No chan");
        offerPromiseWithResolvers.reject("No chan");
        return () => {
        };
    }
    const actions = {
        "gameinit": () => {
            offerPromiseWithResolvers.reject("bad server");
        },
        "offer_and_cand": (data) => {
            offerPromiseWithResolvers.resolve(data);
        },
        "stop_waiting": () => {
            dataChan.close();
        }
    };
    const unsubscribe = broad_chan_to_actions(signalingChan, actions, logger, true, id);
    await signalingChan.ready();
    signalingChan.send("join", {}, "all");
    return unsubscribe;
}

async function sendOffer(dataToSend, serverId, sigChannelPromise) {
    const signalingChan = await sigChannelPromise;
    if (signalingChan) {
        await signalingChan.ready();
        signalingChan.send("offer_and_cand", dataToSend, serverId);
    }
}

async function closeSig(sigChannelPromise) {
    const signalingChan = await sigChannelPromise;
    if (signalingChan) {
        signalingChan.close();
    }
}

async function unsubscribe(unsubscribePromise) {
    const unsub = await unsubscribePromise;
    unsub();
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
    const sigChannelPromise = Promise.race([
        createSignalingChannel(myId, serverId, window.location, settings, signalingLogger),
        delayReject(5000)
    ]).catch(() => null);
    const dataChanLogger = loggerFunc(document, settings, 3);
    const dataChan = createDataChannelClient(myId, dataChanLogger);
    const qrLogger = loggerFunc(document, settings, 1);
    const unsubscribePromise = connectDataAndSig(dataChan, sigChannelPromise, offerPromise, dataChanLogger, myId);
    const oPromise = Promise.race([offerPromise.promise, delayReject(5000)]);
    let commChan = null;
    try {
        const dataToSend = await dataChan.getClientData(oPromise);
        const qr = showQr(window, document, settings, dataToSend, qrLogger);
        sendOffer(dataToSend, dataChan.getOtherId(), sigChannelPromise);
        await dataChan.ready();
        removeElem(qr);
        closeSig(sigChannelPromise);
        commChan = dataChan;
    } catch (err) {
        mainLogger.error(err);
        const sigChan = await sigChannelPromise;
        if (sigChan) {
            await sigChan.ready();
        }
        commChan = sigChan;
    } finally {
        unsubscribe(unsubscribePromise);
    }
    return commChan;
}
