import {delay} from "../utils/timer.js";
import supaChannel from "./supabase_channel.js";

async function makeSupaChanServer(id, settings, logger) {
    const name = supaChannel.getConnectionUrl(id, settings);
    const supabaseClient = supaChannel.createSupaClient();
    const chan = supaChannel.createSignalingChannelWithNameByClient(name, id, logger, supabaseClient);
    const lobbyName = supaChannel.getConnectionUrl("lobby", settings);
    const lobbyChanel = supaChannel.createSignalingChannelWithNameByClient(lobbyName, id, logger, supabaseClient);

    lobbyChanel.on("message", (json) => {
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

    await Promise.all([chan.ready(), lobbyChanel.ready()]);
    logger.log("supa chan ready");
    return chan;
}

async function prepareLobbyClient(id, settings, logger, supabaseClient) {
    const lobbyName = supaChannel.getConnectionUrl("lobby", settings);
    const lobbyChanel = supaChannel.createSignalingChannelWithNameByClient(lobbyName, id, logger, supabaseClient);

    const servers = [];
    lobbyChanel.on("message", (json) => {
        if (json.from === id) {
            logger.error("Ignore self");
            return;
        }
        logger.log(json);
        if (json.action === "in_lobby") {
            servers.push(json.from);
            return;
        }
        logger.log("unknown action");
    });
    await lobbyChanel.ready();
    lobbyChanel.send("join", {}, "all");
    await delay(500);
    logger.log("connected", id);
    if (servers.length !== 1) {
        logger.log(servers);
        // TODO show every service and make user choose
        supabaseClient.removeAllChannels();
        throw new Error("Bad servers number");
    }
    const serverId = servers[0];
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
    return gameChannel;
}

export default {
    makeSupaChanServer,
    makeSupaChanClient
};
