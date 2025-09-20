import handlersFunc from "../utils/handlers.js";

export default function connectionFunc(id, logger, signaling) {
    if (!signaling) {
        throw new Error("No signaling");
    }
    const handlers = handlersFunc(["close", "disconnect", "error", "join", "gameinit", "reconnect"]);
    const on = handlers.on;

    let externalHandlers = null;

    function registerHandler(handler) {
        logger.log("register1");
        externalHandlers = handler;
    }

    const sendRawAll = (type, data, ignore) => {
        logger.log("broad send", type, data);
        return signaling.send(type, data, "all", ignore);
    };

    const sendRawTo = (type, data, to) => signaling.send(type, data, to);

    async function connect() {
        logger.log("bind signal");
        signaling.on("message", (json) => {
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
                logger.log("handlers.actionKeys");
                return handlers.call(json.action, json);
            }
            if (externalHandlers && externalHandlers.hasAction(json.action)) {
                return externalHandlers.call(json.action, json.data);
            }
            logger.log("Unknown action " + json.action);
        });
        await signaling.ready();
        return {sendRawAll, sendRawTo, registerHandler};
    }

    const dispose = () => {
        for (const action of handlers.actionKeys()) {
            handlers.set(action, []);
        }
        registerHandler(null);
    };

    return {
        connect, on, registerHandler, sendRawAll, sendRawTo, dispose
    };
}
