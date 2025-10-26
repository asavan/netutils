import handlersFunc from "../utils/handlers.js";
import {processCandidates, SetupFreshConnection} from "./common_webrtc.js";
import {delay} from "../utils/timer.js";

export default function createDataChannel(id, logger) {
    const handlers = handlersFunc(["error", "open", "message", "beforeclose", "close"]);
    let isConnected = false;
    let dataChannel = null;
    let serverId = null;

    const localCandidates = [];
    const candidateWaiter = Promise.withResolvers();

    const connectionPromise = Promise.withResolvers();

    const send = (action, data) => {
        if (!isConnected) {
            console.error("Not connected");
            return false;
        }
        if (!serverId) {
            console.error("No server");
            console.trace("How");
        }
        if (!dataChannel) {
            console.error("Not data channel");
            return false;
        }
        const json = {from: id, to: serverId, action, data};
        logger.log("Sending [" + id + "] to [" + serverId + "]: " + JSON.stringify(data));
        const str = JSON.stringify(json);
        return dataChannel.send(str);
    };

    async function processOffer(offerAndCandidates) {
        const candidateAdder = {
            add : (cand) => {
                localCandidates.push(cand);
            },
            done: () => {
                candidateWaiter.resolve(localCandidates);
            },
            resetCands : () => {
                // TODO
                logger.error("Try to reset");
            }
        };
        const peerConnection = SetupFreshConnection(id, logger, candidateAdder);

        peerConnection.ondatachannel = (ev) => {
            dataChannel = ev.channel;
            setupDataChannel(ev.channel);
        };
        const offer = offerAndCandidates.offer;
        await peerConnection.setRemoteDescription(offer);
        if (offerAndCandidates.cands) {
            await processCandidates(offerAndCandidates.cands, peerConnection);
        }
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        logger.log("set answer", JSON.stringify(peerConnection.localDescription));
        return () => answer;
    }

    function getCandidates() {
        return candidateWaiter.promise;
    }

    function setupDataChannel(dataChannel) {
        dataChannel.onmessage = function (e) {
            logger.log("data get " + e.data);
            const json = JSON.parse(e.data);
            return handlers.call("message", json);
        };

        dataChannel.onopen = function () {
            logger.log("------ DATACHANNEL OPENED ------");
            isConnected = true;
            connectionPromise.resolve(id);
            return handlers.call("open", id);
        };

        dataChannel.onclose = function () {
            logger.log("------ DC closed! ------");
            isConnected = false;
            return handlers.call("close", id);
        };

        dataChannel.onerror = function () {
            logger.error("DC ERROR!!!");
        };
    }

    const close = async () => {
        connectionPromise.reject("close");
        // iphone fires "onerror" on close socket
        await handlers.call("beforeclose", id);
        if (isConnected) {
            isConnected = false;
            if (dataChannel) {
                dataChannel.close();
            }
        }
    };

    const {on, unsubscribe, unsubscribeAll} = handlers;

    const ready = () => connectionPromise.promise;

    async function getClientData(offerPromise) {
        const offerAndCandidates = await offerPromise;
        serverId = offerAndCandidates.id;
        logger.log("get offer promise", offerAndCandidates);
        const answer = await processOffer(offerAndCandidates);
        const timer = delay(2000);
        const candidatesPromice = getCandidates();
        const cands = await Promise.race([candidatesPromice, timer]);
        const answer1 = answer();
        const dataToSend = {sdp: answer1.sdp, id, cands};
        logger.log("send reply", dataToSend, answer1, cands);
        return dataToSend;
    }

    const getOtherId = () => serverId;
    return {on, unsubscribe, unsubscribeAll, send, close, ready, getClientData, getOtherId};
}
