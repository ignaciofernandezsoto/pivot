export type JobConfig = {
    executeEveryMs: number,
    stopRunningTaskOnUpdate: boolean,
}

export type JobHandler = {
    config: JobConfig,
    execute: (sendTelegramUpdate: (message: string) => void) => Promise<boolean>,
}