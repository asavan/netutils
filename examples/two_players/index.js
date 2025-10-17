import addSettingsButton from "../../src/js/views/settings-form-btn.js";
import netObj from "../../src/js/utils/net.js";
import loggerFunc from "../../src/js/views/logger.js";

async function main(window, document) {
    const settings = {
        logger: ".log",
        logLevel: 2,
        idNameInStorage: "my-id",
        idNameLen : 6
    }
    addSettingsButton(document, settings);
    const myId = netObj.getMyId(window, settings, Math.random);
    const logger = loggerFunc(document, settings);
    console.log("123", myId);
    logger.log(myId);
}

main(window, document);
