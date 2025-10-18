import netObj from "../utils/net.js";
import {delayReject} from "../utils/timer.js";

async function createSocketChan(id, logger, location, settings) {
    const socketUrl = netObj.getWebSocketUrl(settings, location);
    if (!socketUrl) {
        throw new Error("Bad socket url");
    }
    const socketModule = await import("./websocket_channel.js");
    const wsChannel = socketModule.default;
    const chan = wsChannel(id, socketUrl, logger);
    await Promise.race([chan.ready(), delayReject(1000)]);
    return chan;
}

async function createSupaChan(id, serverId, settings, logger) {
    const lobbyModule = await import("./supabase_lobby.js");
    const supaLobby = lobbyModule.default;
    if (id === serverId) {
        return supaLobby.makeSupaChanServer(id, settings, logger);
    }
    return supaLobby.makeSupaChanClient(id, settings, logger, serverId);
}

async function createAutoChan(id, serverId, location, settings, logger) {
    try {
        const chan = await createSocketChan(id, logger, location, settings);
        return chan;
    } catch (err) {
        logger.error(err);
        return createSupaChan(id, serverId, settings, logger);
    }
}

export default async function createSignalingChannel(id, serverId, location, settings, logger) {
    const channelType = settings.channelType;
    switch (channelType) {
    case "socket":
        return createSocketChan(id, logger, location, settings);
    case "supa":
        return createSupaChan(id, serverId, settings, logger);
    case "auto":
        return createAutoChan(id, serverId, location, settings, logger);
    case "fake": {
        const fakeChan = await import("./fake_channel.js");
        return fakeChan.default(id, logger);
    }
    case "none":
        return null;
    }
}
