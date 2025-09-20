export default function onGameEnd(document, message1, message2) {
    const overlay = document.querySelector(".overlay");
    const close = document.querySelector(".close");
    const btnInstall = document.querySelector(".install");

    close.addEventListener("click", (e) => {
        e.preventDefault();
        overlay.classList.remove("show");
    }, false);

    const h2 = overlay.querySelector("h2");
    h2.textContent = message1;
    const content = overlay.querySelector(".content");
    content.textContent = message2;
    overlay.classList.add("show");
    btnInstall.classList.remove("hidden2");
}
