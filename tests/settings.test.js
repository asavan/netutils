import test from "node:test";
import assert from "node:assert/strict";

import {parseSettings} from "../index.js";

const settingsOriginal = {
    modes: ["net", "fake", "ai", "hotseat", "server", "match"],
    mode: "net",
    debug: true,
    wsPort : 8088,
    negotiatedId: 3,
    color: "blue",
    useSound: false
};

test("parse settings", () => {
    const search = "?mode=server";
    const settings = {...settingsOriginal};
    const changed = parseSettings(search, settings);
    assert.deepStrictEqual(changed, ["mode"]);
});


test("wh search params", () => {
    const search = "?mode=server";
    const params = new URLSearchParams(search);
    params.append("wh", "http://localhost:8088");
    assert.equal(params.toString(), "mode=server&wh=http%3A%2F%2Flocalhost%3A8088");

    params.set("wh", "http://192.168.0.27:8088");
    assert.equal(params.toString(), "mode=server&wh=http%3A%2F%2F192.168.0.27%3A8088");

    params.set("wh", "ws://localhost:8088");
    assert.equal(params.toString(), "mode=server&wh=ws%3A%2F%2Flocalhost%3A8088");

    params.set("wh", "ws://192.168.0.27:8088");
    assert.equal(params.toString(), "mode=server&wh=ws%3A%2F%2F192.168.0.27%3A8088");

});
