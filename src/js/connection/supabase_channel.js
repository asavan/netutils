import { createClient } from "@supabase/supabase-js";
import supabase_settings from "./supabase_settings.js";
import handlersFunc from "../utils/handlers.js";

function getConnectionUrl(id, settings) {
    return settings.gameChanPrefix + id;
}

function createSupaClient() {
    return createClient(supabase_settings.SUPABASE_URL,
        supabase_settings.SUPA_API_ANON_KEY);
}

function createSignalingChannelWithNameByClient(name, id, logger, supabase) {
    const handlers = handlersFunc(["error", "open", "message", "beforeclose", "close"]);
    const on = handlers.on;
    const myChannel = supabase.channel(name);
    let readyCounter = 0;
    let needClose = true;
    logger.log("chan: " + name);

    const send = (type, sdp, to, ignore) => {
        const json = {from: id, to: to, action: type, data: sdp, ignore};
        logger.log(name, "Sending [" + id + "] to [" + to + "]: " + JSON.stringify(json));
        return myChannel.send({
            type: "broadcast",
            event: type,
            payload: json,
        });
    };

    myChannel
        .on(
            "broadcast",
            { event: "*" }, // Listen for "shout". Can be "*" to listen to all events
            (payload) => {
                const json = payload.payload;
                return handlers.call("message", json);
            }
        );

    const close = async () => {
        await handlers.call("beforeclose", id);
        await myChannel.unsubscribe();
        return myChannel.teardown();
    };

    const readyPromise = new Promise((resolve, reject) => {
        ++readyCounter;
        console.log("readyCounter " + readyCounter);
        myChannel.subscribe(async (status) => {
            if (status !== "SUBSCRIBED") {
                if (needClose) {
                    needClose = false;
                    logger.error("SUBSCRIBED " + name, status);
                    handlers.call("error", id);
                    await close();
                    reject(status);
                } else {
                    logger.log("SUBSCRIBED2 " + name, status);
                }
                return;
            }
            handlers.call("open", id);
            resolve(status);
        });
    });


    function ready() {
        return readyPromise;
    }

    // const getName = () => name;

    const reset = handlers.reset;
    return {on, send, close, ready, reset};
}

export default {
    getConnectionUrl,
    createSupaClient,
    createSignalingChannelWithNameByClient
};
