export default function wrapClientConnection(internalConnection, serverId) {
    const sendRawTo = (type, data) => internalConnection.sendRawTo(type, data, serverId);
    const sendJoin = () => internalConnection.sendRawAll("join", {});
    return {
        sendRawClient: sendRawTo,
        sendJoin
    };
}
