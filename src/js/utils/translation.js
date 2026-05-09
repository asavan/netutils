function declOfNum(number, titles) {
    const cases = [2, 0, 1, 1, 1, 2];
    return titles[(number % 100 > 4 && number % 100 < 20) ? 2 : cases[(number % 10 < 5) ? number % 10 : 5]];
}

function numAndDeclOfNum(number, titles) {
    return number + " " + declOfNum(number, titles);
}

export function pluralize(count, noun, suffix = "s") {
    let ending = "";
    if (count !== 1) {
        ending = suffix;
    }
    return `${count} ${noun}` + ending;
}

function langLoaderObj(promise) {
    return {
        promise: promise,
        isLoaded: false,
        lang: null
    };
}

export function translator(externalLang, langLoader) {
    const langs = {};
    let currentLang = externalLang;

    const supportedLangs = Object.keys(langLoader);
    if (supportedLangs.length === 0) {
        throw new Error("No langs");
    }
    if (supportedLangs.indexOf(currentLang) < 0) {
        currentLang = supportedLangs[0];
    }

    const detectByBrowser = (window) => {
        const locale = new Intl.Locale(window.navigator.language);
        return locale.language;
    };

    const getLang = () => currentLang;

    const loadLang = (lang) => {
        if (langs[lang]) {
            return langs[lang].promise;
        }
        const promiseHandler = langLoader[lang];
        if (!promiseHandler) {
            throw new Error("No lang");
        }
        const promise = promiseHandler();
        langs[lang] = langLoaderObj(promise);
        return promise;
    };

    const getString = async (key, lang) => {
        const dict = await loadLang(lang);
        return dict[key];
    };

    const warmUp = () => loadLang(getLang());


    const t = (key) => getString(key, currentLang);

    const pluraliseInner = async (key, num) => {
        const forms = await t(key);
        if (currentLang === "ru") {
            return numAndDeclOfNum(num, forms);
        }
        return pluralize(num, forms);
    };

    const setLang = (externalLang) => {
        if (supportedLangs.indexOf(externalLang) >= 0) {
            currentLang = externalLang;
            return true;
        }
        return false;
    };

    return {
        t,
        detectByBrowser,
        warmUp,
        setLang,
        pluralise: pluraliseInner,
        getLang
    };
}
