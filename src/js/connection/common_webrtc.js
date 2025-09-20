export async function processCandidates(candidates, peerConnection) {
    for (const candMessage of candidates) {
        if (!candMessage.candidate) {
            await peerConnection.addIceCandidate(null);
        } else {
            await peerConnection.addIceCandidate(candMessage);
        }
    }
}

export function SetupFreshConnection(id, logger, candidateAdder) {
    const peerConnection = new RTCPeerConnection();

    peerConnection.onicecandidate = e => {
        logger.log("Received icecandidate", id, e);
        if (!e) {
            logger.error("No ice");
            return;
        }
        const message = {
            type: "candidate",
            candidate: null,
        };
        if (e.candidate) {
            message.candidate = e.candidate.candidate;
            message.sdpMid = e.candidate.sdpMid;
            message.sdpMLineIndex = e.candidate.sdpMLineIndex;
        }
        candidateAdder.add(message);
        // localCandidates.push(message);

        if (!e.candidate) {
            candidateAdder.done();
            // candidateWaiter.resolve(localCandidates);
        }
    };

    peerConnection.oniceconnectionstatechange = (e) => {
        logger.log("connection statechange", peerConnection.iceConnectionState);
        if (peerConnection.iceConnectionState === "failed" || peerConnection.iceConnectionState === "disconnected") {
            logger.error("failed iceConnectionState", e);
            // peerConnection.restartIce();
            // candidateAdder.resetCands();
        }
    };

    return peerConnection;
}
