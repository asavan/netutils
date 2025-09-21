import loggerFunc from "../views/logger.js";
import addSettingsButton from "../views/settings-form-btn.js";
import supaLobby from "../connection/supabase_lobby.js";
import netObj from "../utils/net.js";
import {beginGame} from "./server_helper.js";
import connectionFunc from "../connection/broadcast.js";

export default async function gameMode(window, document, settings, gameFunction) {
    const networkLogger = loggerFunc(document, settings);
    addSettingsButton(document, settings);
    const myId = netObj.getMyId(window, settings, Math.random);
    const gameChannel = await supaLobby.makeSupaChanServer(myId, settings, networkLogger);
    const connection = connectionFunc(myId, networkLogger, gameChannel);
    const game = beginGame(window, document, settings, gameFunction, connection, connection, myId);
    await connection.connect();
    return game;
}
