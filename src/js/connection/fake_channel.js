import handlersFunc from "../utils/handlers.js";
import {delay} from "../utils/timer.js";

const clients = {};

export default function createSignalingChannel(id, logger) {
    logger.log("fake chan");
    const handlers = handlersFunc(["error", "open", "message", "beforeclose", "close"]);
    // const ws = new WebSocket(socketUrl);
    clients[id] = {onmessage : onMessageInner};

    const onConnect = async () => {
        await delay(10);
        handlers.call("open", id);
    };

    onConnect();

    const send = async (type, sdp, to, ignore) => {
        const json = {from: id, to: to, action: type, data: sdp, ignore};
        logger.log("Sending [" + id + "] to [" + to + "]: " + JSON.stringify(sdp));
        const text = JSON.stringify(json);
        await delay(10);
        for (const [key, client] of Object.entries(clients)) {
            if (key !== id) {
                client.onmessage(text);
            }
        }
    };

    const close = async () => {
        // iphone fires "onerror" on close socket
        await handlers.call("beforeclose", id);
        delete clients[id];
        return handlers.call("close", id);
    };

    function ready() {
        return Promise.resolve();
    }

    const on = handlers.on;

    function onMessageInner(text) {
        logger.log("Websocket message received: " + text);
        const json = JSON.parse(text);
        return handlers.call("message", json);
    }
    return {on, send, close, ready};
}
