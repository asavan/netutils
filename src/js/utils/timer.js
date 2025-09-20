export const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

export const delayReject = async (ms) => {
    await delay(ms);
    throw new Error("timeout " + ms);
};
