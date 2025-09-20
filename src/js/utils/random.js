function makeId(length, rngFunc) {
    let result = "";
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const charactersLength = characters.length;
    for ( let i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(rngFunc() * charactersLength));
    }
    return result;
}

function randomInteger(min, max) {
    const rand = min + Math.random() * (max - min);
    return Math.floor(rand);
}

function randomIndex(len) {
    return randomInteger(0, len);
}

function randomEl(arr) {
    return arr[randomIndex(arr.length)];
}

export default {
    makeId,
    randomEl
};
