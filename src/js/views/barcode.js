import {delay} from "../utils/timer.js";

export default async function scanBarcode(window, document, logger) {
    try {
        const videoCont = document.querySelector(".video-barcode");
        if (!videoCont || videoCont.querySelector("video") || !("BarcodeDetector" in window)) {
            return;
        }
        const barcodeDetector = new BarcodeDetector({formats: ["qr_code"]});
        const stream = await navigator.mediaDevices.getUserMedia({video: {facingMode: "environment"}});
        const video = document.createElement("video");
        video.srcObject = stream;
        videoCont.append(video);
        // video.autoplay = true;
        await video.play();
        const codesPromise = Promise.withResolvers();

        const detect = async (codesPromise) => {
            const barcodes = await barcodeDetector.detect(video);
            if (barcodes.length > 0) {
                logger.log(barcodes);
                // Process the detected barcodes
                const tracks = stream.getTracks();
                for (const track of tracks) {
                    track.stop();
                }
                video.remove();
                codesPromise.resolve(barcodes[0].rawValue);
            } else {
                logger.error("No codes found");
                await delay(100);
                requestAnimationFrame(() => {
                    detect(codesPromise);
                });
            }
            return codesPromise;
        };

        detect(codesPromise);
        return codesPromise.promise;
    } catch (error) {
        logger.error("Error accessing camera or detecting barcodes:", error);
    }
}
