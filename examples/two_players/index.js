import addSettingsButton from "../../src/js/views/settings-form-btn.js";
import netObj from "../../src/js/utils/net.js";
import loggerFunc from "../../src/js/views/logger.js";
import {server_chan} from "../../src/js/connection/rtc_server_chan.js";
import {client_chan} from "../../src/js/connection/rtc_client_chan.js";

async function main(window, document) {
    const settings = {
        logger: ".log",
        logLevel: 2,
        idNameInStorage: "my-id",
        channelType: "none",
        idNameLen : 6
    }
    addSettingsButton(document, settings);
    const myId = netObj.getMyId(window, settings, Math.random);
    const logger = loggerFunc(document, settings);
    console.log("123", myId);
    logger.log(myId);
    const pc = new RTCPeerConnection();
    const sd = pc.currentLocalDescription;
    logger.log(sd);
    try {
        const clientChan = await client_chan(myId, window, document, settings);
        console.log("Client", clientChan);
    } catch (e) {
        console.log(e);
        const chan = await server_chan(myId, window, document, settings);
        console.log("Never", chan);
    }
}

main(window, document);
