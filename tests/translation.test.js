import test from "node:test";
import assert from "node:assert/strict";
import translator from "../src/js/utils/translation.js";

function localeLoader() {
    return {
        "en": async () => {
            const module = await import("./locales/en.json", {
                with: {
                    type: "json"
                }
            });
            return module.default;
        },
        "ru": async () => {
            const module = await import("./locales/ru.json", {
                with: {
                    type: "json"
                }
            });
            return module.default;
        }
    };
}

test("translate simple", async () => {
    const langLoader = {
        "en": () => Promise.resolve({"mode": "test"})
    };
    const trans = translator("en", langLoader);
    const word = await trans.t("mode");
    assert.equal(word, "test");
});


test("translate load locales", async () => {
    const langLoader = localeLoader();
    const trans = translator("en", langLoader);
    const word = await trans.t("move");
    assert.equal(word, "Move");
});

test("translate plural", async () => {
    const langLoader = localeLoader();
    const trans = translator("ru", langLoader);
    const word = await trans.pluralise("move", 3);
    assert.equal(word, "3 хода");

    const langSetted = trans.setLang("en");
    assert.ok(langSetted);
    const word2 = await trans.pluralise("move", 3);
    assert.equal(word2, "3 Moves");
});
