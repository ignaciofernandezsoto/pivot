import {JobHandler} from "../job-handler";
import axios from "axios";

let alreadyNotified = false;

const init = (sendTelegramUpdate: (message: string) => void) => {
    notifyIfUpdated(sendTelegramUpdate);
    setInterval(
        () => notifyIfUpdated(sendTelegramUpdate),
        parseInt(process.env.INMAE_JOB_EVERY_MS!)
    );
}

const notifyIfUpdated = async (sendTelegramUpdate: (message: string) => void) => {
    if (alreadyNotified) return;

    const response = await axios
        .post('https://inmae-cmae.com.ar/ModalStatusTurnos.php', process.env.INMAE_JOB_BODY);

    if (!(response.data as string).includes("EN CURSO")) {
        sendTelegramUpdate("There's been an update! Go check https://inmae-cmae.com.ar/#");
        alreadyNotified = true;
    }
}

export const InmaeJobHandler: JobHandler = {
    init,
}