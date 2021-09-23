import {Client} from "transmission-api";
import TelegramBot from "node-telegram-bot-api";

import dotenv from "dotenv";

dotenv.config();

const telegramToken = process.env.TELEGRAM_BOT_TOKEN!;
const bot = new TelegramBot(telegramToken, {polling: true});

const transmissionClient = new Client("", {
    username: process.env.TRANSMISSION_USERNAME,
    password: process.env.TRANSMISSION_PASSWORD,
});

const whitelistedUsers = process.env.WHITELISTED_USERS!.split(' ').map(u => parseInt(u));

const statePerStatusNumber = {
    '0': "⏸ Stopped",
    '1': "⌛🕵️ Queued to check files",
    '2': "🕵️ Checking files",
    '3': "⌛▶️ Queued to download",
    '4': "▶️ Downloading",
    '5': "⌛🌱 Queued to seed",
    '6': "🌱 Seeding",
    '7': "🤷‍♂️ Can't find peers",
}

const numberFormat = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2
});

bot.onText(/\/torrents$/, async (msg) => {
    const chatId = msg.chat.id;
    if (!whitelistedUsers.includes(chatId)) return;

    try {
        const torrents = await transmissionClient.getAllTorrents();

        if (torrents.length && !Array.isArray(torrents[0])) {
            await bot.sendMessage(
                chatId,
                `🔢 ${torrents.length} torrents
                ${torrents.map(t => `      
🆔 ${t.id}
🏷 ${t.name}
${(statePerStatusNumber as any)[t.status.toString()]}
🕒 ${t.eta > 0 ? etaToTimeString(t.eta) : '00:00:00'}
📏 ${numberFormat.format(t.totalSize / (1024 * 1024 * 1024))} GB
🏁 ${numberFormat.format(t.percentDone * 100)}%
🚄 ${numberFormat.format(t.rateDownload / 1000000)} MiB/s
            `).join(
``
                )}`
            );
        } else {
            await bot.sendMessage(
                chatId,
                '🔢 No torrents'
            );
        }
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
        const torrent = await transmissionClient.addTorrent(magnetUri);
        await bot.sendMessage(
            chatId,
            `
🆔 ${(torrent as any)["torrent-added"].id}
🏷 ${(torrent as any)["torrent-added"].name}
            `
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
        await transmissionClient.removeTorrent(id, true);
        await bot.sendMessage(
            chatId,
            `🆔 ${id} deleted`
        );
    } catch (e) {
        console.log(e);
        await bot.sendMessage(
            chatId,
            `${e}`
        );
    }
});

const etaToTimeString = (eta: number) => {
    const date = new Date(0);
    date.setSeconds(eta);
    return date.toISOString().substr(11, 8);
}