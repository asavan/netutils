import {hideElem, showElem} from "./helper.js";
export default function install(window, document) {
    const btnAdd = document.querySelector(".butInstall");
    let deferredPrompt;
    btnAdd.addEventListener("click", (e) => {
        e.preventDefault();
        hideElem(btnAdd);
        // Show the prompt
        deferredPrompt.prompt();
        // Wait for the user to respond to the prompt
        deferredPrompt.userChoice.then((resp) => {
            console.log(JSON.stringify(resp));
        });
    });

    window.addEventListener("beforeinstallprompt", (e) => {
        // Prevent the mini-info bar from appearing.
        e.preventDefault();
        // Stash the event so it can be triggered later.
        deferredPrompt = e;
        showElem(btnAdd);
    });
    return btnAdd;
}
