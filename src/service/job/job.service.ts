import {JobHandler} from "./handler/job-handler";
import {TemperatureHandler} from "./handler/sensor/temperature/temperature-handler";
import {ServiceType} from "../service-type";
import {TrainTicketsHandler} from "./handler/scrapper/traintickets/train-tickets-handler";

const jobHandlers: JobHandler[] = [
    TemperatureHandler,
    TrainTicketsHandler,
];

const init = (serviceType: ServiceType, sendTelegramUpdate: (message: string) => void) =>
    jobHandlers
        .filter(jh => jh.config.isOn)
        .filter(jh => jh.config.type === serviceType)
        .forEach(
            jh => {
                const timer = setInterval(
                    async () => {
                        const sentUpdate = await jh.execute(sendTelegramUpdate);
                        if (sentUpdate && jh.config.stopRunningTaskOnUpdate) {
                            clearInterval(timer);
                        }
                    },
                    jh.config.executeEveryMs
                )
            }
        );

export const JobService = {
    init,
}