import handlersFunc from "../utils/handlers.js";

function stub() {
    // do nothing.
}

export default function createSignalingChannel(id, socketUrl, logger) {
    const handlers = handlersFunc(["error", "open", "message", "beforeclose", "close"]);
    const ws = new WebSocket(socketUrl);
    const connectionPromise = Promise.withResolvers();

    const send = (action, data, to, ignore) => {
        const json = {from: id, to, action, data, ignore};
        logger.log("Sending [" + id + "] to [" + to + "]: " + JSON.stringify(data));
        return ws.send(JSON.stringify(json));
    };

    const close = async () => {
        // iphone fires "onerror" on close socket
        await handlers.call("beforeclose", id);
        ws.onerror = stub;
        return ws.close();
    };

    const on = (name, f) => handlers.on(name, f);

    const ready = () => connectionPromise.promise;

    function onMessageInner(text) {
        logger.log("Websocket message received: " + text);
        const json = JSON.parse(text);
        return handlers.call("message", json);
    }

    ws.onopen = function() {
        connectionPromise.resolve(id);
        return handlers.call("open", id);
    };

    ws.onclose = function (e) {
        logger.log("Websocket closed " + e.code + " " + e.reason);
        return handlers.call("close", id);
    };

    ws.onmessage = async function (e) {
        if (e.data instanceof Blob) {
            const text = await e.data.text();
            return onMessageInner(text);
        }
        return onMessageInner(e.data);
    };

    ws.onerror = function (e) {
        logger.error(e);
        connectionPromise.reject(e);
        return handlers.call("error", id);
    };
    return {on, send, close, ready};
}
