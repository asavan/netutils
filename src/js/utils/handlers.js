import {assert} from "./assert.js";

export default function handlersFunc(arr, queue) {
    const handlers = {};
    let hCounter = 0;
    for (const f of arr) {
        handlers[f] = {};
    }

    const objKey = (c) => "key" + c;

    const actionKeys = () => Object.keys(handlers);
    const getSafe = (name) => {
        const obj = handlers[name];
        assert(obj !== undefined, "No key " + name);
        return obj;
    };
    const hasAction = (name) => actionKeys().includes(name);
    const on = (name, callback) => {
        assert(typeof callback === "function", "bad setup " + name);
        const obj = getSafe(name);
        ++hCounter;
        const key = objKey(hCounter);
        obj[key] = callback;
        return key;
    };

    const unsubscribe = (name, key) => {
        const obj = getSafe(name);
        delete obj[key];
    };

    const unsubscribeAll = () => {
        for (const f of arr) {
            handlers[f] = {};
        }
    }

    const reset = (name, callback) => {
        assert(hasAction(name), "No name for reset " + name);
        handlers[name] = {};
        on(name, callback);
    };
    const set = (f, arr1) => {
        handlers[f] = arr1;
    };
    const getAction = (name) => (arg) => call(name, arg);
    const call = (name, arg) => {
        const obj = getSafe(name);
        const callbacks = Object.values(obj);
        if (callbacks.length === 0) {
            // console.trace("No handlers " + name);
            return Promise.resolve();
        }
        const operation = () => {
            const promises = callbacks.map(f => Promise.try(f, arg));
            assert(callbacks.length > 0, "No handlers2 " + name);
            assert(promises[0] !== undefined, "No handlers3 " + name);
            return Promise.allSettled(promises);
        };

        if (queue) {
            return queue.add(operation);
        }
        return operation();
    };

    return {
        on,
        set,
        call,
        reset,
        getAction,
        hasAction,
        unsubscribe,
        unsubscribeAll,
        actionKeys
    };
}
