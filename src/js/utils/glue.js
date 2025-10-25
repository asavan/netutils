import { assert } from "./assert.js";

/*callable getAction, hasAction*/
// onable on, unsubscribe

function glue(keys, onable, callable) {
    const unsubArr = [];
    for (const action of keys) {
        if (!callable.hasAction(action)) {
            continue;
        }
        const callback = callable.getAction(action);
        const unsubKey = onable.on(action, callback);
        const unsub = () => onable.unsubscribe(action, unsubKey);
        unsubArr.push(unsub);
    }
    assert(unsubArr.length > 0, "Bad glue");
    const unsubscribe = () => {
        for (const unsub of unsubArr) {
            unsub();
        }
    }
    return unsubscribe;
}

export function actionsToCallable(mapper) {
    const getAction = (name) => mapper[name];
    const hasAction = (action) => Object.hasOwn(mapper, action);
    return {
        hasAction,
        getAction
    };
}

export function glueSimple(onable, callable) {
    return glue(onable.actionKeys(), onable, callable);
}
