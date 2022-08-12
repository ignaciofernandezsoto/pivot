import {JobHandler} from "../../job-handler";
import {TrainTicketsService} from "../../../../scrapper/traintickets/train-tickets.service";

const config = {
    type: "train-tickets" as const,
    executeEveryMs: 43200000, // 12 hours
    stopRunningTaskOnUpdate: false,
}

const execute = async (sendTelegramUpdate: (message: string) => void): Promise<boolean> => {

    const fullAvailability = await TrainTicketsService.fetchFullAvailability();

    // at least there's one bound available
    if (fullAvailability.inbound.concat(fullAvailability.outbound).length) {
        const message = await TrainTicketsService.fullAvailabilityAsMessage(fullAvailability);
        sendTelegramUpdate(message);
        return Promise.resolve(true);
    } else {
        return Promise.resolve(false);
    }

}

export const TrainTicketsHandler: JobHandler = {
    config,
    execute
}