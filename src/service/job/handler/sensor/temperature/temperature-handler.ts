import {JobHandler} from "../../job-handler";

const config = {
    executeEveryMs: 900000,
    stopRunningTaskOnUpdate: false
}

const execute = (sendTelegramUpdate: (message: string) => void): Promise<boolean> => {
    return Promise.resolve().then(() => true); // TODO
}

export const TemperatureHandler: JobHandler = {
    config,
    execute
}