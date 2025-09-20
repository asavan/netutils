import {showGameView} from "../views/section_view.js";
import actionToHandler from "../utils/action_to_handler.js";
import wrapClientConnection from "../connection/client_wrap_connection.js";

function setupGameToConnectionSendClient(game, con, logger, actionKeys) {
    for (const handlerName of actionKeys) {
        game.on(handlerName, (n) => {
            if (!n || (n.playerId !== null && n.playerId !== n.clientId)) {
                logger.log("ignore", n);
                return;
            }
            con.sendRawClient(handlerName, n);
        });
    }
}

export function beginGame(gameContext, actionsFunc, logger, openCon, data) {
    logger.log("Start game", data);
    showGameView(gameContext.document);
    const presenter = gameContext.presenter;
    const game = gameContext.game;
    const actions = actionsFunc(game);
    const gameHandler = actionToHandler(actions);
    openCon.registerHandler(gameHandler);
    const wrapConnecton = wrapClientConnection(openCon, data.serverId);
    setupGameToConnectionSendClient(game, wrapConnecton, logger, Object.keys(actions));

    if (gameContext.settings.fastRestart) {
        game.on("winclosed", () => {
            presenter.nextRound();
            game.redraw();
        });
    }
    return game;
}
