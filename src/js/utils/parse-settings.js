function stringToBoolean(string) {
    switch (string?.toLowerCase()?.trim()) {
    case "true": case "yes": case "1": return true;
    case "false": case "no": case "0": case "": case null: return false;
    default: return Boolean(string);
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

export async function parseZipSettings(queryString, settings) {
    const urlParams = new URLSearchParams(queryString);
    const changed = [];
    let zipParams = null;
    const updateSettings = (key, value) => {
        if (typeof settings[key] === "number") {
            settings[key] = Number.parseInt(value, 10);
        } else if (typeof settings[key] === "boolean") {
            settings[key] = stringToBoolean(value);
        } else {
            settings[key] = value;
        }
        changed.push(key);
    }
    for (const [key, value] of urlParams) {
        if (key === "z") {
            const unzipModule = await import("jsoncrush");
            const JSONCrush = unzipModule.default;
            zipParams = JSONCrush.uncrush(value);
        } else {
            updateSettings(key, value);
        }
    }
    if (zipParams) {
        const extraParams = JSON.parse(zipParams);
        for (const [key, value] of Object.entries(extraParams)) {
            updateSettings(key, value);
        }
    }
    return changed;
}
