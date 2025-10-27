export async function unsubscribe(unsubscribePromise) {
    const unsub = await unsubscribePromise;
    unsub();
}
