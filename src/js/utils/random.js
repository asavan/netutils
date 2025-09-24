function makeId(length, rngFunc) {
    let result = "";
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const charactersLength = characters.length;
    for ( let i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(rngFunc() * charactersLength));
    }
    return result;
}

function randomInteger(min, max, rngFunc) {
    const rand = min + rngFunc() * (max - min);
    return Math.floor(rand);
}

function randomIndex(len, rngFunc) {
    return randomInteger(0, len, rngFunc);
}

function randomEl(arr, rngFunc = Math.random) {
    return arr[randomIndex(arr.length, rngFunc)];
}

export default {
    makeId,
    randomEl
};
