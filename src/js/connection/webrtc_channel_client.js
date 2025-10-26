import handlersFunc from "../utils/handlers.js";
import {processCandidates, SetupFreshConnection} from "./common_webrtc.js";
import connectionFuncSig from "./broadcast.js";
import actionToHandler from "../utils/action_to_handler.js";
import {delay, delayReject} from "../utils/timer.js";

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
        // const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription();
        logger.log("set answer", JSON.stringify(peerConnection.localDescription));
        return () => peerConnection.localDescription;
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

    const on = handlers.on;

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
        const dataToSend = {sdp: answer1.sdp, id};
        logger.log("send reply", dataToSend, answer1, cands);
        return dataToSend;
    }

    async function connect(networkPromise, signalingChan) {
        logger.log("client connect");
        const sigConnectionPromise = Promise.withResolvers();
        if (signalingChan) {
            const sigConnection = connectionFuncSig(id, logger, signalingChan);
            sigConnection.on("gameinit", async (data) => {
                console.log(data);
                serverId = data.from;
                sigConnection.dispose();
                networkPromise.reject("timeout");
                await Promise.race([networkPromise.promise, Promise.resolve()]);
                connectionPromise.reject("timeout3");
            });
            const actions = {
                "offer_and_cand": (data) => {
                    networkPromise.resolve(data);
                    return Promise.resolve();
                },
                "stop_waiting": () => {
                    connectionPromise.reject("timeout2");
                    networkPromise.reject("timeout5");
                    return Promise.resolve();
                }
            };
            const handlers = actionToHandler(actions);
            sigConnection.registerHandler(handlers);
            const openCon = await sigConnection.connect();
            sigConnectionPromise.resolve(openCon);
            // TODO join should be to specific server
            openCon.sendRawAll("join", {});
        } else {
            networkPromise.reject("No chan");
            // sigConnectionPromise.reject("No chan");
        }

        const offerPromise = Promise.race([networkPromise.promise, delayReject(5000)]);
        const dataToSend = await getClientData(offerPromise);
        if (signalingChan) {
            const openCon = await sigConnectionPromise.promise;
            openCon.sendRawTo("offer_and_cand", dataToSend, serverId);
        }

        return dataToSend;
    }
    const getOtherId = () => serverId;
    return {on, send, close, ready, connect, getClientData, getOtherId};
}
