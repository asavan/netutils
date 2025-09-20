function windowContext(window, document, settings) {
    return {
        window,
        document,
        settings
    };
}

function gameContext(context, game, presenter) {
    context.game = game;
    context.presenter = presenter;
    return context;
}

function idContext(context, id) {
    context.id = id;
    return context;
}

export default {
    windowContext,
    idContext,
    gameContext
};
