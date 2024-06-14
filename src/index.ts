import {MovieService} from "./service/movie/movie.service";

require('dotenv').config();

import TelegramBot from "node-telegram-bot-api";
import {TorrentService} from "./service/torrent/torrent.service";
import {JobService} from "./service/job/job.service";
import {ServiceType} from "./service/service-type";

const telegramToken = process.env.TELEGRAM_BOT_TOKEN!;
const bot = new TelegramBot(
    telegramToken,
    {
        polling: true,
        request: {
            agentOptions: {
                keepAlive: true,
                family: 4,
            },
            url: "https://api.telegram.org",
        }
    }
);
const whitelistedServiceUsers: { [key in ServiceType]: number[] } = {
    [ServiceType.TORRENT]: process.env.WHITELISTED_TORRENT_USERS!.split(',').map(u => parseInt(u)),
    [ServiceType.MOVIE]: process.env.WHITELISTED_MOVIE_USERS!.split(',').map(u => parseInt(u)),
};

Object.keys(whitelistedServiceUsers)
    .map(key => ServiceType[key as keyof typeof ServiceType])
    .forEach(jobType =>
        JobService.init(
            jobType,
            (msg: string) => {
                const whitelistedUsersForService = whitelistedServiceUsers[jobType]
                whitelistedUsersForService.forEach(
                    user => bot.sendMessage(user, msg, {parse_mode: "HTML"})
                );
            })
    );

bot.onText(/\/torrents$/, async (msg) => {
    const chatId = msg.chat.id;
    if (!whitelistedServiceUsers[ServiceType.TORRENT].includes(chatId)) return;
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
    if (!whitelistedServiceUsers[ServiceType.TORRENT].includes(chatId)) return;

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
    if (!whitelistedServiceUsers[ServiceType.TORRENT].includes(chatId)) return;

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

bot.onText(/\/movies(?:\s+(.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    if (!whitelistedServiceUsers[ServiceType.MOVIE].includes(chatId)) return;

    await bot.sendMessage(
        chatId,
        "ON IT!!"
    )

    const movieQuery = match?.at(1);

    try {
        await bot.sendMessage(
            chatId,
            JSON.stringify(await MovieService.getAllMovies(movieQuery))
        )
    } catch (e) {
        console.log(e);
        await bot.sendMessage(
            chatId,
            `${e}`
        );
    }

});