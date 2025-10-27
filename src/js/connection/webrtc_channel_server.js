import handlersFunc from "../utils/handlers.js";
import {processCandidates, SetupFreshConnection} from "./common_webrtc.js";
import {delayReject} from "../utils/timer.js";

export default function createDataChannel(id, logger) {
    const handlers = handlersFunc(["error", "open", "message", "beforeclose", "close"]);
    let isConnected = false;
    let dataChannel = null;
    let clientId = null;

    let candidateWaiter = Promise.withResolvers();
    let offerPromise = Promise.withResolvers().promise;
    let answerAndCandPromise = Promise.withResolvers();

    let peerConnection = null;

    let reconnectCounter = 0;

    let connectionPromise = Promise.withResolvers();

    const resetPromises = () => {
        candidateWaiter = Promise.withResolvers();
        answerAndCandPromise = Promise.withResolvers();
        connectionPromise = Promise.withResolvers();
        offerPromise = updateOffer();
        return offerPromise;
    };

    const resolveExternal = (data) => answerAndCandPromise.resolve(data);

    const send = (action, data, to, ignore) => {
        if (!isConnected) {
            logger.error("Not connected");
            return false;
        }
        if (!clientId) {
            logger.error("No client");
            console.trace("How");
        }
        if (to === undefined) {
            to = clientId;
        }
        if (to !== "all" && to !== clientId) {
            logger.error("Bad client", to, clientId);
            console.trace("Bad client");
        }
        if (!dataChannel) {
            logger.error("Not data channel");
            return false;
        }
        // const json = {from: id, to: clientId, action, data};
        const json = {from: id, to, action, data, ignore};
        logger.log("before send", action, dataChannel.readyState, dataChannel.label, dataChannel.id);
        logger.log(action + " Sending1 [" + id + "] to [" + to + "]: " + JSON.stringify(data));
        const str = JSON.stringify(json);
        return dataChannel.send(str);
    };

    let localCandidates = [];
    const resetCands = async () => {
        localCandidates = [];
        await resetPromises();
        logger.log("Offer reseted", peerConnection.iceConnectionState);
        await processAns();
        logger.log("Ans reseted", dataChannel.label, peerConnection.iceConnectionState);
        console.timeLog("reconnect", "reset2");
    };

    function setupConnection() {

        const candidateAdder = {
            add: (cand) => {
                localCandidates.push(cand);
            },
            done: () => {
                candidateWaiter.resolve(localCandidates);
            },
            resetCands: resetCands
        };
        peerConnection = SetupFreshConnection(id, logger, candidateAdder);

        dataChannel = peerConnection.createDataChannel("gamechannel" + id);

        logger.log("datachanid " + dataChannel.id, dataChannel.label);

        setupDataChannel(false);

        // const sdpConstraints = {offerToReceiveAudio: false, offerToReceiveVideo: false};
    }

    async function updateOffer() {
        // const offer = await peerConnection.createOffer();
        // await peerConnection.setLocalDescription(offer);
        // logger.log("create offer", offer);
        await peerConnection.setLocalDescription();
        return () => peerConnection.localDescription;
    }

    async function setAnswerAndCand(data) {
        clientId = data.id;
        const answer = {type: "answer", sdp: data.sdp};
        await peerConnection.setRemoteDescription(answer);
        if (data.cands) {
            logger.log("cands");
            await processCandidates(data.cands, peerConnection);
        }
        logger.log("answer", data);
    }

    async function getOfferAndCands() {
        const timer = delayReject(2000);
        const offerFunc = await offerPromise;
        const cands = await Promise.race([candidateWaiter.promise, timer]).catch(() => []);
        const offer = offerFunc();
        logger.log("cands", cands.length);
        return {
            offer,
            id
        };
    }

    function setupDataChannel(isReconnect) {
        dataChannel.onmessage = function (e) {
            logger.log("data get " + e.data);
            const json = JSON.parse(e.data);
            return handlers.call("message", json);
        };

        dataChannel.onopen = function () {
            logger.log("------ DATACHANNEL OPENED ------");
            const sctp = peerConnection.sctp;
            const maxMessageSize = sctp.maxMessageSize;
            logger.log("datachanid " + dataChannel.id, dataChannel.label, maxMessageSize);
            isConnected = true;
            connectionPromise.resolve(id);
            if (isReconnect) {
                console.timeEnd("reconnect");
            }
            return handlers.call("open", id);
        };

        dataChannel.onclose = function (err) {
            logger.error("------ DC closed! ------", dataChannel.readyState, err);
            isConnected = false;
            const externalCloseCall = handlers.call("close", id);
            ++reconnectCounter;
            console.time("reconnect");
            dataChannel = peerConnection.createDataChannel("chanReconnect" + reconnectCounter + id);
            setupDataChannel(true);
            peerConnection.restartIce();
            resetCands();
            return externalCloseCall;
        };

        dataChannel.onerror = function (err) {
            logger.error("DC ERROR!!!", dataChannel.readyState, err);
            // peerConnection.restartIce();
            // resetCands();
        };
    }

    const close = async (reason) => {
        // iphone fires "onerror" on close socket
        reason ??= "close chan";
        connectionPromise.reject(reason);
        await handlers.call("beforeclose", id);
        if (isConnected) {
            isConnected = false;
            if (dataChannel) {
                logger.log("Try to close");
                dataChannel.close();
            }
        }
    };

    const on = handlers.on;

    const ready = () => connectionPromise.promise;

    async function getDataToSend() {
        setupConnection();
        offerPromise = updateOffer();
        const dataToSend = await getOfferAndCands();
        return dataToSend;
    }

    async function processAns() {
        logger.log("before before set");
        const answerAndCand = await answerAndCandPromise.promise;
        logger.log("before set", answerAndCand);
        await setAnswerAndCand(answerAndCand);
        logger.log("after set", answerAndCand);
    }

    const getOtherId = () => clientId;

    return {on, send, close, ready, getDataToSend, getOtherId, resolveExternal, processAns};
}
