import handlersFunc from "../utils/handlers.js";
import {delay} from "../utils/timer.js";

function SetupFreshConnection(logger) {
    const pc = new RTCPeerConnection();

    pc.onsignalingstatechange = (ev) => {
        logger.log("signaling state change " + pc.signalingState, ev);
    };

    pc.onicecandidateerror = (ev) => {
        if (ev.errorCode === 701) {
            logger.log("ONICECANDIDATEERROR " + ev.url + " " + ev.errorText);
        } else {
            logger.log("ONICECANDIDATEERROR", ev);
        }
    };

    return pc;
}

export function createDataChannelV2(logger, initiator) {
    const handlers = handlersFunc(["error", "open", "message", "beforeclose", "close", "remote"]);
    let peerConnection = null;
    let isConnected = false;
    let dataChannel = null;

    let reconnectCount = 0;

    let connectionPromise = Promise.withResolvers();

    const resetPromises = () => {
        connectionPromise = Promise.withResolvers();
    };

    peerConnection = SetupFreshConnection(logger);

    peerConnection.ondatachannel = (ev) => {
        dataChannel?.close();
        dataChannel = ev.channel;
        if (initiator) {
            logger.error("ERROR Received datachannel");
        } else {
            logger.log("Received datachannel " + dataChannel.id);
        }
        setupDataChannel(ev.channel);
    };

    peerConnection.oniceconnectionstatechange = (e) => {
        logger.log("connection state change " + peerConnection.iceConnectionState + " " + dataChannel?.id);
        if (peerConnection.iceConnectionState === "failed" || peerConnection.iceConnectionState === "disconnected") {
            logger.error("failed iceConnectionState " + peerConnection.iceConnectionState, e);
            resetPromises();
        }
    };

    peerConnection.onnegotiationneeded = (ev) => {
        logger.log("ONNEGOTIATIONNEEDED", ev);
    };

    peerConnection.onicegatheringstatechange = (ev) => {
        logger.log("onicegatheringstatechange", ev);
        const connection = ev.target;

        switch (connection.iceGatheringState) {
        case "gathering":
            logger.log("gathering", ev);
            break;
        case "complete": {
            logger.log("gathering complete");
            handlers.call("remote", peerConnection.localDescription);
            break;
        }
        }
    };

    peerConnection.onclosing = (ev) => {
        logger.log("Received closing", ev);
    };

    const createOffer = async (otherId) => {
        if (!initiator) {
            logger.error("NOT INITIATOR CREATE OFFER");
        }
        if (reconnectCount === 0) {
            dataChannel = peerConnection.createDataChannel("gamechannel" + otherId);
        } else {
            dataChannel = peerConnection.createDataChannel("chanReconnect" + reconnectCount + otherId);
        }
        logger.log("datachanid " + dataChannel.id, dataChannel.label);
        setupDataChannel(dataChannel);
        logger.log("createOffer before delay " + dataChannel.label);
        // await delay(100);
        logger.log("createOffer after delay " + dataChannel.id);
        await peerConnection.setLocalDescription();
        logger.log("createOffer after setLocalDescription " + dataChannel.id);
    };

    const send = (data) => {
        if (!isConnected) {
            logger.error("Not connected");
            return false;
        }
        if (!dataChannel) {
            logger.error("Not data channel");
            return false;
        }
        const str = JSON.stringify(data);
        return dataChannel.send(str);
    };

    async function processOffer(offer) {
        if (initiator) {
            logger.error("ERROR NON Initiator", initiator, offer);
        }
        logger.log("Before set offer");
        await peerConnection.setRemoteDescription(offer);
        logger.log("After set offer");
        await peerConnection.setLocalDescription();
        logger.log("AFTER create local answer ");
    }

    async function processAnswer(answer) {
        logger.log("Before set answer", answer);
        await peerConnection.setRemoteDescription(answer);
        logger.log("After set answer", answer);
        await delay(200);
        logger.log("After set answer and delay");
    }

    function setupDataChannel(dataChannel) {
        console.time("setupDataChannel");
        // resetPromises();
        dataChannel.onmessage = function (e) {
            logger.log("data get " + e.data);
            const json = JSON.parse(e.data);
            return handlers.call("message", json);
        };

        dataChannel.onopen = function () {
            console.timeEnd("setupDataChannel");
            isConnected = true;
            logger.log("------ DATACHANNEL OPENED ------" + dataChannel.label);
            const sctp = peerConnection.sctp;
            const maxMessageSize = sctp.maxMessageSize;
            const candsStr = JSON.stringify(sctp.transport.iceTransport.getSelectedCandidatePair());
            logger.log("datachanid " + dataChannel.id + " " + candsStr);
            logger.log("chan " + dataChannel.protocol + " " + dataChannel.reliable + " " + maxMessageSize);
            logger.log("chan2 " + dataChannel.ordered + " " + dataChannel.binaryType + " ");

            connectionPromise.resolve(dataChannel.label);
            return handlers.call("open", dataChannel.label);
        };

        dataChannel.onclosing = (event) => {
            logger.log("------ DC closing! ------", event);
            isConnected = false;
            resetPromises();
            ++reconnectCount;
            peerConnection.restartIce();
            return handlers.call("beforeclose", {});
        };

        dataChannel.onclose = function () {
            logger.log("------ DC closed! ------");
            isConnected = false;
            return handlers.call("close", {});
        };

        dataChannel.onerror = function (e) {
            logger.error("DC ERROR!!!", e);
        };
    }

    const close = async () => {
        connectionPromise.reject("close");
        // iphone fires "onerror" on close socket
        if (isConnected) {
            isConnected = false;
            await handlers.call("beforeclose", {});
            dataChannel?.close();
        }
        peerConnection.close();
    };

    const ready = () => connectionPromise.promise;
    return {...handlers, send, close, ready, createOffer, processOffer, processAnswer};
}
