require('dotenv').config();

import TelegramBot from "node-telegram-bot-api";
import {TorrentService} from "./service/torrent/torrent.service";
import {JobService} from "./service/job/job.service";
import {ServiceType} from "./service/service-type";

const telegramToken = process.env.TELEGRAM_BOT_TOKEN!;
const bot = new TelegramBot(telegramToken, {polling: true});

const whitelistedServiceUsers: { [key in ServiceType]: number[]; } = {
    "torrent": process.env.WHITELISTED_TORRENT_USERS!.split(',').map(u => parseInt(u)),
}

Object.keys(whitelistedServiceUsers).forEach(jobType =>
    JobService.init(
        jobType as ServiceType,
        (msg: string) => {
            const whitelistedUsersForService = whitelistedServiceUsers[jobType as ServiceType]
            whitelistedUsersForService.forEach(
                user => bot.sendMessage(user, msg, {parse_mode: "HTML"})
            );
        })
);

bot.onText(/\/torrents$/, async (msg) => {
    const chatId = msg.chat.id;
    if (!whitelistedServiceUsers["torrent"].includes(chatId)) return;
    try {
        await bot.sendMessage(
            chatId,
            await TorrentService.getAllAsMessage()
        );
    } catch (e) {
        console.log(e);
        await bot.sendMessage(
            chatId,
            `${e}`
        );
    }
});

bot.onText(/\/torrents add (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    if (!whitelistedServiceUsers["torrent"].includes(chatId)) return;

    const magnetUri = match![1];

    try {
        await bot.sendMessage(
            chatId,
            await TorrentService.add(magnetUri)
        );
    } catch (e) {
        console.log(e);
        await bot.sendMessage(
            chatId,
            `${e}`
        );
    }
});

bot.onText(/\/torrents delete (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    if (!whitelistedServiceUsers["torrent"].includes(chatId)) return;

    const id = parseInt(match![1]);

    try {
        await bot.sendMessage(
            chatId,
            await TorrentService.deleteById(id)
        );
    } catch (e) {
        console.log(e);
        await bot.sendMessage(
            chatId,
            `${e}`
        );
    }
});