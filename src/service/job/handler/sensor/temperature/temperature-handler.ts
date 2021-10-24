import {JobHandler} from "../../job-handler";
import {TemperatureService} from "../../../../temperature/temperature-service";

const config = {
    type: "temperature" as const,
    executeEveryMs: 900000,
    stopRunningTaskOnUpdate: false,
    minTemperature: parseInt(process.env.MIN_TEMPERATURE!),
    maxTemperature: parseInt(process.env.MAX_TEMPERATURE!),
}

const execute = (sendTelegramUpdate: (message: string) => void): Promise<boolean> => {
    const currentTemperature = TemperatureService.getTemperature();
    if (isInRange(currentTemperature)) return Promise.resolve(false);
    sendTelegramUpdate(`Yikes! It's ${currentTemperature}°C`);
    return Promise.resolve(true)
}

const isInRange = (temperature: number) =>
    temperature <= config.maxTemperature &&
    temperature >= config.minTemperature

export const TemperatureHandler: JobHandler = {
    config,
    execute
}