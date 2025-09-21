import wsChannel from "./websocket_channel.js";
import netObj from "../utils/net.js";
import supaLobby from "./supabase_lobby.js";
import {delayReject} from "../utils/timer.js";

export default async function createSignalingChannel(id, location, settings, logger) {
    const socketUrl = netObj.getWebSocketUrl(settings, location);
    if (!socketUrl) {
        return supaLobby.makeSupaChanServer(id, settings, logger);
    }
    try {
        const chan = wsChannel(id, socketUrl, logger);
        await Promise.race([chan.ready(), delayReject(1000)]);
        chan.clientModeName = () => "client";
        return chan;
    } catch (err) {
        logger.error(err);
        return supaLobby.makeSupaChanServer(id, settings, logger);
    }
}
