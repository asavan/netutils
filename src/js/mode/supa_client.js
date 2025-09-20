import loggerFunc from "../views/logger.js";
import addSettingsButton from "../views/settings-form-btn.js";
import netObj from "./net.js";
import connectionFunc from "../connection/broadcast.js";
import {beginGame} from "./client_helper.js";
import supaLobby from "../connection/supabase_lobby.js";
import {assert} from "../utils/helper.js";

export default async function gameMode(window, document, settings, gameFunction) {
    const networkLogger = loggerFunc(document, settings);
    addSettingsButton(document, settings);
    const myId = netObj.getMyId(window, settings, Math.random);
    const gameChannel = await supaLobby.makeSupaChanClient(myId, settings, networkLogger);

    const connection = connectionFunc(myId, networkLogger, gameChannel);
    const openConPromise = Promise.withResolvers();
    const gamePromise = Promise.withResolvers();
    connection.on("gameinit", async (data) => {
        networkLogger.log("init", data);
        const openCon = await openConPromise.promise;
        const game = beginGame(window, document, settings, gameFunction,
            networkLogger, openCon, data.data);
        gamePromise.resolve(game);
    });

    connection.on("reconnect", (data) => {
        assert(data.data.serverId === data.from, `Different server ${data}`);
        window.location.reload();
    });

    const openCon = await connection.connect();
    openConPromise.resolve(openCon);
    openCon.sendRawTo("join", {}, gameChannel.getServerId());
    return gamePromise.promise;
}
