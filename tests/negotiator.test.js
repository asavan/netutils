import test from "node:test";
import assert from "node:assert/strict";
import handlersFunc from "../src/js/utils/handlers.js";
import {negotiator, wrapNetworkToNegotiator} from "../src/js/connection/negotiator.js";

const payload = {
    "id": "xcvb",
    "game" : {
        "round" : {
            "move" : {
                "bestPos": 4,
                "bestK": 7,
                "result": 0
            }
        }
    },
    "network": {
        "ping": "somekey"
    }
};

const payload3 = {
    "game" : {
        "round" : {
            "move" : {
                "bestPos": 4,
                "bestK": 7,
                "result": 0
            }
        }
    }
};


function network(externalHandler1) {
    const handler = handlersFunc(["message"]);
    let externalHandler = externalHandler1;
    const setExternalHandler = (externalHandler1) => {
        externalHandler = externalHandler1;
    };
    const send = (str) => {
        externalHandler.call("message", str);
    };
    const {on} = handler;
    const getHandler = () => handler;
    return {
        send,
        getHandler,
        setExternalHandler,
        on
    };
}


test("simple network", () => {
    let numOfCalls = 0;
    const n1 = network();
    const n2 = network(n1.getHandler());
    n1.setExternalHandler(n2.getHandler());
    n1.on("message", msg => {
        assert.equal(msg, "first message");
        ++numOfCalls;
    });
    n2.on("message", msg => {
        assert.equal(msg, "second message");
        ++numOfCalls;
    });
    n2.send("first message");
    n1.send("second message");
    assert.equal(numOfCalls, 2);
});


test("send payload", () => {
    const n1 = network();
    const n2 = network(n1.getHandler());
    n1.setExternalHandler(n2.getHandler());
    const neg1 = wrapNetworkToNegotiator(n1);
    const gameNeg = negotiator({name: "game"});
    neg1.registerHandler(gameNeg);
    const roundNeg = negotiator({name: "round"});
    gameNeg.registerHandler(roundNeg);

    let wasCalled = false;
    const moveHandler = () => {
        wasCalled = true;
    };
    const moveNeg = negotiator({name: "move", callback: moveHandler});
    roundNeg.registerHandler(moveNeg);

    n2.send(payload);
    assert.ok(wasCalled);
});

test("send move", () => {
    const n1 = network();
    const n2 = network(n1.getHandler());
    n1.setExternalHandler(n2.getHandler());
    const neg1 = wrapNetworkToNegotiator(n1);
    const gameNeg = negotiator({name: "game"});
    neg1.registerHandler(gameNeg);
    const roundNeg = negotiator({name: "round"});
    gameNeg.registerHandler(roundNeg);

    let wasCalled = false;
    const moveHandler = (data) => {
        // was not called
        console.log("Move " + JSON.stringify(data));
        throw new Error("Should not be called");
    };
    const moveNeg = negotiator({name: "move", callback: moveHandler});
    roundNeg.registerHandler(moveNeg);

    n2.on("message", msg => {
        assert.equal(msg, JSON.stringify(payload3));
        wasCalled = true;
    });

    const move1 = {
        "bestPos": 4,
        "bestK": 7,
        "result": 0
    };

    moveNeg.send(move1);
    assert.ok(wasCalled);
});
