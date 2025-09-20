export function showGameView(document) {
    const mainSection = document.querySelector(".game");
    mainSection.classList.remove("hidden");
    const lobbySection = document.querySelector(".lobby");
    lobbySection.classList.add("hidden");
    const menuSection = document.querySelector(".menu");
    menuSection.querySelector(".control-panel")?.classList.add("absolute");

    const logSection = document.querySelector(".log");
    logSection.innerHTML = "";
}
