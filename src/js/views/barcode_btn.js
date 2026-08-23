import JSONCrush from "jsoncrush";
import scanBarcode from "../views/barcode.js";
import {addButton} from "./buttons.js";

export function showReadBtn(window, document, logger) {
    const barCodeReady = Promise.withResolvers();
    const btn = addButton(window, document, "▣", "QR", async () => {
        let codes = await scanBarcode(window, document, logger);
        logger.log("codes1", codes);
        if (!codes) {
            const sign = prompt("Get code from qr");
            if (sign == null) {
                // barCodeReady.reject();
                return;
            }
            codes = sign;
        }
        const decode = JSONCrush.uncrush(codes);
        btn.remove();
        barCodeReady.resolve(JSON.parse(decode));
    });
    return barCodeReady.promise;
}
