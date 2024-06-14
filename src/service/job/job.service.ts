import {JobHandler} from "./handler/job-handler";
import {ServiceType} from "../service-type";

const jobHandlers: JobHandler[] = [
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