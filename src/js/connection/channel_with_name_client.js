import wsChannel from "./websocket_channel.js";
import netObj from "../utils/net.js";
import supaLobby from "./supabase_lobby.js";
import {delayReject} from "../utils/timer.js";


export default async function createSignalingChannel(id, location, settings, logger, serverId) {
    const socketUrl = netObj.getWebSocketUrl(settings, location);
    if (!socketUrl) {
        return supaLobby.makeSupaChanClient(id, settings, logger, serverId);
    }
    try {
        const chan = wsChannel(id, socketUrl, logger);
        await Promise.race([chan.ready(), delayReject(1000)]);
        return chan;
    } catch (err) {
        logger.error(err);
        return supaLobby.makeSupaChanClient(id, settings, logger, serverId);
    }
}
