import {JobHandler} from "./handler/job-handler";

const jobHandlers: JobHandler[] = [];

const init = (sendTelegramUpdate: (message: string) => void) =>
    jobHandlers.forEach(
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