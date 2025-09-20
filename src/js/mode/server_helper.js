import lobbyFunc from "../lobby.js";
import loggerFunc from "../views/logger.js";
import {showGameView} from "../views/section_view.js";
import actionToHandler from "../utils/action_to_handler.js";

function reconnect(con, serverId) {
    const toSend = {
        serverId: serverId,
    };
    return con.sendRawAll("reconnect", toSend);
}

function setupGameToConnectionSend(game, con, lobby, logger, actionKeys) {
    for (const handlerName of actionKeys) {
        logger.log("register " + handlerName);
        game.on(handlerName, (n) => {
            let ignore;
            if (n && n.playerId !== undefined) {
                const toIgnore = lobby.idByInd(n.playerId);
                ignore = [toIgnore];
                if (lobby.isAllIgnored(ignore)) {
                    logger.log("ignore " + handlerName);
                    return;
                }
            }
            logger.log("send " + handlerName);
            try {
                con.sendRawAll(handlerName, n, ignore);
            } catch (e) {
                logger.error(e);
            }
            logger.log("after call " + handlerName);
        });
    }
}

export function connectNetworkAndGame(document, game, presenter, myId, settings, con, connection, actionsFunc) {
    const lobby = lobbyFunc({}, presenter.getClientIndex(), myId);
    lobby.addClient(myId, myId);

    const connectionLogger = loggerFunc(document, settings, 10);

    game.on("winclosed", () => {
        presenter.nextRound();
        game.redraw();
        return reconnect(connection, myId);
    });

    connection.on("join", (data) => {
        connectionLogger.log("join", data);
        lobby.addClient(data.from, data.from);
        const joinedInd = lobby.indById(data.from);
        const serverInd = lobby.indById(myId);
        if (lobby.size() === settings.playerLimit && presenter.isGameOver()) {
            presenter.resetRound();
            showGameView(document);
        }

        const presenterObj = presenter.toJson(joinedInd);
        const toSend = {
            serverId: myId,
            joinedInd,
            serverInd,
            presenter: presenterObj
        };
        con.sendRawTo("gameinit", toSend, data.from);
        return game.redraw();
    });

    const actions = actionsFunc(game);
    const gameHandler = actionToHandler(actions);
    connection.registerHandler(gameHandler);
    setupGameToConnectionSend(game, connection, lobby, connectionLogger, Object.keys(actions));
}
