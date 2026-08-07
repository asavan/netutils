import test from "node:test";
import assert from "node:assert/strict";

import {netObj} from "../index.js";

const settingsOriginal = {
    modes: ["net", "fake", "ai", "hotseat", "server", "match"],
    mode: "net",
    debug: true,
    wsPort : 8088,
    negotiatedId: 3,
    color: "blue",
    useSound: false
};

const settingsWithPath = {
    modes: ["net", "fake", "ai", "hotseat", "server", "match"],
    mode: "net",
    debug: true,
    wsPort : 8080,
    wsPath : "/signaling",
    negotiatedId: 3,
    color: "blue",
    useSound: false
};

test("socketUrlOrig", () => {
    const host = "http://192.168.0.27:8088";
    const hostUrl = new URL(host);
    const settings = {...settingsOriginal};
    const socketUrl = netObj.getWebSocketUrl(settings, hostUrl);
    assert.equal(socketUrl, "ws://192.168.0.27:8088");
});

test("socketUrlWithPath", () => {
    const host = "http://192.168.0.27:8088?mode=server";
    const hostUrl = new URL(host);
    const settings = {...settingsWithPath};
    const socketUrl = netObj.getWebSocketUrl(settings, hostUrl);
    assert.equal(socketUrl, "ws://192.168.0.27:8080/signaling");
});
