import TelegramBot from "node-telegram-bot-api";

import dotenv from "dotenv";
import {TorrentService} from "./service/torrent/torrent.service";

dotenv.config();

const telegramToken = process.env.TELEGRAM_BOT_TOKEN!;
const bot = new TelegramBot(telegramToken, {polling: true});

const whitelistedUsers = process.env.WHITELISTED_USERS!.split(' ').map(u => parseInt(u));

bot.onText(/\/torrents$/, async (msg) => {
    const chatId = msg.chat.id;
    if (!whitelistedUsers.includes(chatId)) return;

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
    if (!whitelistedUsers.includes(chatId)) return;

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
    if (!whitelistedUsers.includes(chatId)) return;

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