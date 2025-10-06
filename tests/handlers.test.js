import test from "node:test";
import assert from "node:assert/strict";
import {delay} from "../src/js/utils/timer.js";
import actionToHandler from "../src/js/utils/action_to_handler.js";

test("init_field", async () => {

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

