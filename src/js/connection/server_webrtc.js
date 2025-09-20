import handlersFunc from "../utils/handlers.js";

const connectionFunc = function (id, logger) {
    logger.log("Webrtc connection " + id);
    const handlers = handlersFunc(["open", "error", "close", "join", "gameinit", "disconnect"]);
    const on = handlers.on;

    const clients = {};

    let externalHandlers = null;

    function registerHandler(handler) {
        externalHandlers = handler;
    }

    const sendRawAll = (action, data, ignore) => {
        logger.log("sending", data);
        for (const [id, client] of Object.entries(clients)) {
            if (ignore && ignore.includes(id)) {
                logger.log("ignore " + id);
                continue;
            }
            if (client.dc) {
                try {
                    client.dc.send(action, data, id);
                } catch (e) {
                    logger.log(e, client);
                }
            } else {
                logger.error("No connection", client);
            }
        }
    };

    const sendRawTo = (action, data, to) => {
        const client = clients[to];
        if (!client || !client.dc) {
            logger.log("No chanel " + to);
            console.trace("No client");
            return;
        }
        return client.dc.send(action, data, to);
    };

    const alwaysResolved = Promise.resolve({sendRawAll, sendRawTo});

    function addChan(chan, clientId) {
        logger.log("bind signal2", clientId);
        clients[clientId] = {dc: chan};
        chan.on("message", (json) => {
            logger.log("Received message", json);
            if (json.from === id) {
                logger.error("same user");
                return;
            }

            if (json.to !== id && json.to !== "all") {
                logger.log("another user");
                return;
            }

            if (json.ignore && Array.isArray(json.ignore) && json.ignore.includes(id)) {
                logger.log("user in ignore list");
                return;
            }
            if (handlers.hasAction(json.action)) {
                logger.log("handlers.actionKeys1");
                return handlers.call(json.action, json);
            }
            if (externalHandlers && externalHandlers.hasAction(json.action)) {
                logger.log("callCurrentHandler");
                return externalHandlers.call(json.action, json.data);
            }
            logger.log("Unknown action " + json.action);
        });
    }

    const connect = () => alwaysResolved;

    return {
        on,
        registerHandler,
        sendRawTo,
        sendRawAll,
        connect,
        addChan
    };
};

export default connectionFunc;
