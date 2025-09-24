import {assert} from "./utils/assert.js";

export default function lobby(clients, shift = 0, myId) {
    const clientsArr = [];
    for (const [key,] of Object.entries(clients)) {
        clientsArr.push(key);
    }
    let index = clientsArr.length;
    const addClient = (id, name) => {
        const oldClient = clients[id];
        if (oldClient) {
            oldClient.name = name;
        } else {
            clients[id] = {index, name};
            clientsArr.push(id);
            ++index;
        }
        assert(index === clientsArr.length);
    };

    const getById = (id) => {
        const el = clients[id];
        assert(el, `No id ${id} in clients`);
        return el;
    };

    const findByIndex = (ind) => {
        const id = clientsArr[ind];
        assert(id, "Bad Index");
        return getById(id);
    };

    const isAllIgnored = (toIgnore) => {
        const toSend = new Set(clientsArr);
        const toIgnoreSet = new Set(toIgnore);
        toIgnoreSet.add(myId);
        const diff = toSend.difference(toIgnoreSet);
        return diff.size === 0;
    };

    // TODO maybe use splice instead
    const remove = (id) => {
        const toRemove = clients[id];
        --index;
        const lastClientId = clientsArr[index];
        clientsArr[toRemove.index] = lastClientId;
        clientsArr.pop();
        const lastClient = clients[lastClientId];
        lastClient.index = toRemove.index;
        clients[id] = undefined;
        assert(index === clientsArr.length);
    };

    const swapEl = (e1, e2) => {
        const tempInd = e1.index;
        const tempId = clientsArr[tempInd];
        clientsArr[e1.index] = clientsArr[e2.index];
        e1.index = e2.index;
        clientsArr[e2.index] = tempId;
        e2.index = tempInd;
    };

    const swapInd = (ind1, ind2) => {
        const el1 = findByIndex(ind1);
        const el2 = findByIndex(ind2);
        swapEl(el1, el2);
    };

    const swapById = (id1, id2) => {
        const el1 = getById(id1);
        const el2 = getById(id2);
        swapEl(el1, el2);
    };

    const wrap = (ind) => (ind + clientsArr.length)%clientsArr.length;
    const indById = (id) => wrap(getById(id).index + shift);
    const idByInd = (ind) => clientsArr[wrap(ind-shift)];
    const size = () => clientsArr.length;

    return {
        addClient,
        remove,
        swapInd,
        swapById,
        indById,
        idByInd,
        isAllIgnored,
        size
    };
}
