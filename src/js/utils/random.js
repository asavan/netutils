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

function selectKRandom(arr, k, rngFunc) {
    if (k > arr.length) {
        return arr;
    }
    let len = arr.length;
    let count = 0;
    while (count < k) {
        const randInd = randomInteger(0, len, rngFunc);
        swap(arr, randInd, len-1);
        --len;
        ++count;
    }
    return arr.slice(len);
}

export default {
    makeId,
    randomEl,
    randomInteger,
    selectKRandom
};
