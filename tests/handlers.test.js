import test from "node:test";
import assert from "node:assert/strict";
import {delay} from "../src/js/utils/timer.js";
import actionToHandler from "../src/js/utils/action_to_handler.js";
import handlersFunc from "../src/js/utils/handlers.js";

test("actionToHandler", async () => {
    const actions = {
        "delay": async (arg) => {
            console.log("sleep1");
            await delay(1000);
            console.log("sleep2");
            return arg;
        }
    };

    const handler = actionToHandler(actions);
    const result = await handler.call("delay", 20);
    assert.equal(20, result[0].value, "init correct");
});


test("unsubscribe", async () => {

    const handler = handlersFunc(["message"]);
    let counter = 0;
    const sub1 = handler.on("message", (arg) => {
        console.log("1", arg);
        ++counter;
    });
    const sub2 = handler.on("message", (arg) => {
        console.log("2", arg);
        ++counter;
    });
    handler.call("message", 3);
    assert.equal(counter, 2, "init correct");
    handler.unsubscribe("message", sub1);
    handler.call("message", 4);
    assert.equal(counter, 3, "unsub incorrect");

    handler.unsubscribe("message", sub1);
    handler.call("message", 5);
    assert.equal(counter, 4, "double unsub incorrect");

    handler.unsubscribe("message", sub2);
    handler.call("message", 6);
    assert.equal(counter, 4, "unsub incorrect");
});

