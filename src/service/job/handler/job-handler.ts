export type JobHandler = {
    init: (sendTelegramUpdate: (message: string) => void) => void,
}