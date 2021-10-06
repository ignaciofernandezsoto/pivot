import {JobHandler} from "./handler/job-handler";
import {InmaeJobHandler} from "./handler/inmae/inmae-job-handler";

const jobHandlers: JobHandler[] = [
    InmaeJobHandler
];

const init = (sendTelegramUpdate: (message: string) => void) =>
    jobHandlers.forEach(
        jh => jh.init(sendTelegramUpdate)
    );

export const JobService = {
    init,
}