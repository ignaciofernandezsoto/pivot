import {ServiceType} from "../../service-type";

export type JobConfig = {
    type: ServiceType,
    executeEveryMs: number,
    stopRunningTaskOnUpdate: boolean,
}

export type JobHandler = {
    config: JobConfig,
    execute: (sendUpdate: (message: string) => void) => Promise<boolean>,
}