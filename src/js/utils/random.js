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

function swap(arr, i, j) {
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
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

function shuffleArray(array, rngFunc) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(rngFunc() * (i + 1));
        const temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}

export default {
    makeId,
    randomEl,
    randomInteger,
    shuffleArray,
    selectKRandom
};
