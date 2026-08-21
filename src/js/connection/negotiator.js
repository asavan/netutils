export function negotiator({name, callback}) {
    const handlers = {};
    let parentSender = null;
    const unsubArr = [];
    let id = null;
    const parseData = (payload, context) => {
        if (context === undefined || context === null) {
            context = payload;
        }
        if (payload.id != id) {
            console.log("Wrong id in data");
        }
        for (const key in payload) {
            if (key in handlers) {
                const runner = handlers[key];
                runner.parseData(payload[key], context);
            }
        }
        if (callback && typeof callback === "function") {
            callback(payload, context);
        }
    };

    const getName = () => name;
    const setId = (id1) => id = id1;

    const send = (data) => {
        if (!parentSender) {
            // wrap?
            return data;
        }
        if (name) {
            const toSend = {};
            toSend[name] = data;
            parentSender.send(modifyData(toSend));
            return toSend;
        } else {
            parentSender.send(modifyData(data));
            return data;
        }
    };

    const idFunc = (data) => data;

    let modifyData = idFunc;

    const setModifyData = (f) => {
        modifyData = f;
    };

    const addUnsub = (data) => {
        unsubArr.push(data);
    };

    const clearUnsub = () => {
        for (const key of unsubArr) {
            if (typeof key === "function") {
                key();
            }
        }
        unsubArr.length = 0;
        for (const key in handlers) {
            handlers[key].clearUnsub();
        }
    };

    const registerHandler = (neg1) => {
        const old = handlers[neg1.getName()];
        if (old) {
            old.setParentSender(null);
            old.clearUnsub();
        }
        handlers[neg1.getName()] = neg1;
        neg1.setParentSender({send});
    };

    const setParentSender = (ps) => parentSender = ps;
    const getParentSender = () => parentSender;

    return {
        addUnsub,
        clearUnsub,
        setId,
        send,
        modifyData,
        setModifyData,
        parseData,
        getName,
        registerHandler,
        setParentSender,
        getParentSender
    };
}

export function wrapNetworkToNegotiator(net1) {
    const neg1 = negotiator({});
    net1.on("message", msg => {
        if (typeof msg === "string") {
            const msg1 = JSON.parse(msg);
            neg1.parseData(msg1);
        } else {
            neg1.parseData(msg);
        }
    });
    neg1.setParentSender(net1);
    return neg1;
}

export function wrapActionsToNegotiator(actions, name, handler) {
    const mainNeg = negotiator({name});
    for (const key in actions) {
        const acNeg = negotiator({name: key, callback: actions[key]});
        const unsubKey = handler.on(key, (data) => acNeg.send(data));
        const unsubFunk = () => handler.unsubscribe(key, unsubKey);
        acNeg.addUnsub(unsubFunk);
        mainNeg.registerHandler(acNeg);
    }
    return mainNeg;
}
