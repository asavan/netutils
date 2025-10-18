import {hideElem, showElem} from "./helper.js";
export default function install(window, document) {
    const btnAdd = document.querySelector(".butInstall");
    let beforeinstallpromptevent;
    btnAdd.addEventListener("click", (e) => {
        if (!beforeinstallpromptevent) {
            return;
        }
        e.preventDefault();
        hideElem(btnAdd);
        // Show the prompt
        beforeinstallpromptevent.prompt();
        // Wait for the user to respond to the prompt
        beforeinstallpromptevent.userChoice.then((resp) => {
            console.log(JSON.stringify(resp));
        });
    });

    window.addEventListener("beforeinstallprompt", (e) => {
        // Prevent the mini-info bar from appearing.
        e.preventDefault();
        // Stash the event so it can be triggered later.
        beforeinstallpromptevent = e;
        showElem(btnAdd);
    });
    return btnAdd;
}
