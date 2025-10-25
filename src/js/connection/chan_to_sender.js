import handlersFunc from "../utils/handlers.js";
import {actionsToCallable, glueSimple} from "../utils/glue.js";

export function broad_chan_to_sender(chan, keys, logger, useDataOnly, id) {
    const handler = handlersFunc(keys);
    const onsubKey = chan.on("message", (data) => {
        if (id) {
            logger.log("Received message", data);
            if (data.from === id) {
                logger.error("same user");
                return;
            }

            if (data.to !== id && data.to !== "all") {
                logger.log("another user");
                return;
            }

            if (data.ignore && Array.isArray(data.ignore) && data.ignore.includes(id)) {
                logger.log("user in ignore list");
                return;
            }
        }
        if (handler.hasAction(data.action)) {
            if (useDataOnly) {
                handler.call(data.action, data.data);
            } else {
                handler.call(data.action, data);
            }
        } else {
            logger.log("not my action " + data.action);
        }
    });
    const unsubscribeAll = () => chan.unsubscribe("message", onsubKey);
    const {on, getActions, unsubscribe} = handler;
    return {on, getActions, unsubscribe, unsubscribeAll};
}

export function broad_chan_to_actions(chan, actions, logger, useDataOnly, id) {
    const keys = Object.keys(actions);
    const callable = actionsToCallable(actions);
    const bcs = broad_chan_to_sender(chan, keys, logger, useDataOnly, id);
    const unsub2 = glueSimple(bcs, callable);
    const unsubscribeAll = () => {
        unsub2();
        bcs.unsubscribeAll();
    }
    return unsubscribeAll;
}
