import {delay} from "../utils/timer.js";
import supaChannel from "./supabase_channel.js";

function wrapServerLobby(lobbyChanel, id, logger) {
    return lobbyChanel.on("message", (json) => {
        logger.log(json);
        if (json.from === id) {
            logger.error("Ignore self");
            return;
        }
        if (json.action === "join") {
            lobbyChanel.send("in_lobby", {}, json.from);
        }
        logger.log("unknown action " + json.action);
    });
}

async function makeSupaChanServer(id, settings, logger) {
    const name = supaChannel.getConnectionUrl(id, settings);
    const supabaseClient = supaChannel.createSupaClient();
    const chan = supaChannel.createSignalingChannelWithNameByClient(name, id, logger, supabaseClient);
    const lobbyName = supaChannel.getConnectionUrl("lobby", settings);
    const lobbyChanel = supaChannel.createSignalingChannelWithNameByClient(lobbyName, id, logger, supabaseClient);
    wrapServerLobby(lobbyChanel, id, logger);
    await Promise.all([chan.ready(), lobbyChanel.ready()]);
    logger.log("supa chan ready");
    return chan;
}

async function prepareLobbyClientCommon(id, settings, logger, supabaseClient) {
    const lobbyName = supaChannel.getConnectionUrl("lobby", settings);
    const lobbyChanel = supaChannel.createSignalingChannelWithNameByClient(lobbyName, id, logger, supabaseClient);

    const serverPromise = Promise.withResolvers();
    const unSubToken = lobbyChanel.on("message", (json) => {
        if (json.from === id) {
            logger.error("Ignore self");
            return;
        }
        logger.log(json);
        if (json.action === "in_lobby") {
            serverPromise.resolve(json.from);
            return;
        }
        logger.log("unknown action");
    });
    await lobbyChanel.ready();
    lobbyChanel.send("join", {}, "all");
    const serverId = await Promise.race([delay(700), serverPromise.promise]);
    logger.log("connected", id);
    lobbyChanel.unsubscribe("message", unSubToken);

    const getServer = () => serverId;
    const getChan = () => lobbyChanel;
    return {getServer, getChan};
}

async function prepareLobbyClient(id, settings, logger, supabaseClient) {
    const lobbyAgent = await prepareLobbyClientCommon(id, settings, logger, supabaseClient);
    const serverId = lobbyAgent.getServer();
    if (!serverId) {
        logger.log("No servers");
        // TODO show every service and make user choose
        supabaseClient.removeAllChannels();
        throw new Error("Bad servers number");
    }
    return serverId;
}

async function prepareLobbyClientOrServer(id, settings, logger, supabaseClient) {
    const lobbyAgent = await prepareLobbyClientCommon(id, settings, logger, supabaseClient);
    const serverId = lobbyAgent.getServer();
    if (!serverId) {
        wrapServerLobby(lobbyAgent.getChan(), id, logger);
        return id;
    }
    return serverId;
}

async function makeSupaChanClient(id, settings, logger, serverId) {
    const supabaseClient = supaChannel.createSupaClient();
    if (!serverId) {
        serverId = await prepareLobbyClient(id, settings, logger, supabaseClient);
    }
    logger.log("client try connect to " + serverId);
    const gameChannel = supaChannel.createSignalingChannelWithNameByClient(
        supaChannel.getConnectionUrl(serverId, settings), id, logger, supabaseClient);
    gameChannel.getServerId = () => serverId;
    await gameChannel.ready();
    return gameChannel;
}

async function makeSupaChanClientOrServer(id, serverId, settings, logger) {
    const supabaseClient = supaChannel.createSupaClient();
    if (!serverId) {
        serverId = await prepareLobbyClientOrServer(id, settings, logger, supabaseClient);
    }
    logger.log("client try connect to " + serverId);
    const gameChannel = supaChannel.createSignalingChannelWithNameByClient(
        supaChannel.getConnectionUrl(serverId, settings), id, logger, supabaseClient);
    gameChannel.getServerId = () => serverId;
    await gameChannel.ready();
    return gameChannel;
}

export default {
    makeSupaChanServer,
    makeSupaChanClient,
    makeSupaChanClientOrServer
};
