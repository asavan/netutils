export default function loggerFunc(document, settings, level, el, markerName) {
    if (!level) {
        level = settings.logLevel;
    }
    if (el && typeof el === "string") {
        el = document.querySelector(el);
    }
    const logHtml = (message, el) => {
        if (!el && settings.logger) {
            el = document.querySelector(settings.logger);
        }
        if (el) {
            if (Error.isError(message)) {
                message = message.toString();
            } else if (typeof message == "object" && JSON && JSON.stringify ) {
                message = JSON.stringify(message);
            }
            el.innerHTML += message + "<br />";
        }
    };

    const logInner = (data, ...args) => {
        if (level < settings.logLevel) {
            return;
        }
        logHtml(data, el);
        return console.log(data, ...args, ...(markerName ? [markerName] : []));
    };
    const errorInner = (data, ...args) => {
        if (level >= settings.logLevel) {
            logHtml(data, el);
        }
        // console.trace(data);
        return console.error(data, ...args);
    };

    return {
        log: logInner,
        error: errorInner
    };
}
