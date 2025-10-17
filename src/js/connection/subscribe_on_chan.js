import actionToHandler from "../utils/action_to_handler.js";

export function subscribe_rtc(chan, actions, onable, keys, logger) {
    const handler = actionToHandler(actions);
    const unsubTicket = chan.on("message", (json) => {
        logger.log("Received message", json);
        if (handler.hasAction(json.action)) {
            return handler.call(json.action, json.data);
        }
        logger.log("Unknown action " + json.action);
    });

    const unsubTikets = {};
    for (const key of keys) {
        const ut = onable.on(key, (data) => {
            chan.send(key, data);
        });
        unsubTikets[key] = ut;
    }

    const unsubsribe = () => {
        chan.unsubscribe("message", unsubTicket);
        for (const key of keys) {
            onable.unsubscribe(key, unsubTikets[key]);
        }
    }

    return {unsubsribe};
}
