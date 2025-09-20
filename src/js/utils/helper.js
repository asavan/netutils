export function hideElem(el) {
    if (el) {
        el.classList.add("hidden");
    }
}

export function showElem(el) {
    if (el) {
        el.classList.remove("hidden");
    }
}

export function removeElem(el) {
    if (el) {
        el.remove();
    }
}

export function swapNodes(n1, n2) {

    const p1 = n1.parentNode;
    const p2 = n2.parentNode;
    let i1, i2;

    if ( !p1 || !p2 || p1.isEqualNode(n2) || p2.isEqualNode(n1) ) {
        return;
    }

    for (let i = 0; i < p1.children.length; i++) {
        if (p1.children[i].isEqualNode(n1)) {
            i1 = i;
        }
    }
    for (let i = 0; i < p2.children.length; i++) {
        if (p2.children[i].isEqualNode(n2)) {
            i2 = i;
        }
    }

    if ( p1.isEqualNode(p2) && i1 < i2 ) {
        i2++;
    }
    p1.before(n2, p1.children[i1]);
    p2.before(n1, p2.children[i2]);
}


export function vibrateIfNeeded(window, inactivePeriod, lastInteractTime) {
    if (inactivePeriod && window.navigator.vibrate) {
        const now = Date.now();
        if ((now - lastInteractTime) > inactivePeriod * 1000) {
            window.navigator.vibrate([200]);
        }
    }
}

function stringToBoolean(string) {
    switch (string.toLowerCase().trim()) {
    case "true": case "yes": case "1": { return true; }
    case "false": case "no": case "0": case undefined: { return false; }
    default: { return Boolean(string); }
    }
}

export function parseSettings(queryString, settings) {
    const urlParams = new URLSearchParams(queryString);
    const changed = [];
    for (const [key, value] of urlParams) {
        if (typeof settings[key] === "number") {
            settings[key] = Number.parseInt(value, 10);
        } else if (typeof settings[key] === "boolean") {
            settings[key] = stringToBoolean(value);
        } else {
            settings[key] = value;
        }
        changed.push(key);
    }
    return changed;
}

export function assert(b, message) {
    if (b) {
        return;
    }
    console.error(message);
    console.trace(message);
    throw new Error(message);
}

export function pluralize(count, noun, suffix = "s") {
    let ending = "";
    if (count !== 1) {
        ending = suffix;
    }
    return `${count} ${noun}` + ending;
}
