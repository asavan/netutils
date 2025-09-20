
export default function PromiseQueue(logger) {
    let queue = Promise.resolve();

    const add = (operation) => new Promise((resolve, reject) => {
        if (typeof operation !== "function") {
            logger?.log("Not function! " + operation);
            reject(new Error("Not function!"));
            return;
        }
        queue = queue
            .then(operation)
            .then(resolve)
            .catch((error) => {
                logger?.error(error);
                reject(error);
            });
    });
    return {add};
}
