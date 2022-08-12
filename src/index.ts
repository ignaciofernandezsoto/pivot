import {TrainTicketsService} from "./service/scrapper/traintickets/train-tickets.service";

require('dotenv').config();

import TelegramBot from "node-telegram-bot-api";
import {TorrentService} from "./service/torrent/torrent.service";
import {TemperatureService} from "./service/temperature/temperature-service";
import {JobService} from "./service/job/job.service";
import {ServiceType} from "./service/service-type";

const telegramToken = process.env.TELEGRAM_BOT_TOKEN!;
const bot = new TelegramBot(telegramToken, {polling: true});

const whitelistedServiceUsers: { [key in ServiceType]: number[]; } = {
    "torrent": process.env.WHITELISTED_TORRENT_USERS!.split(',').map(u => parseInt(u)),
    "temperature": process.env.WHITELISTED_TEMPERATURE_USERS!.split(',').map(u => parseInt(u)),
    "train-tickets": process.env.WHITELISTED_TRAIN_TICKETS!.split(',').map(u => parseInt(u))
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

bot.onText(/\/trainavailability$/, async (msg) => {
    const chatId = msg.chat.id;
    if (!whitelistedServiceUsers["train-tickets"].includes(chatId)) return;
    try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() + 7); // Starting next week :-)

        const endDate = new Date();
        endDate.setDate(startDate.getDate() + 7); // One week after the starting date

        const availability = await TrainTicketsService.availabilityAsMessage(startDate, endDate);
        await bot.sendMessage(
            chatId,
            availability,
            { parse_mode: "HTML" }
        );
    } catch (e) {
        console.log(e);
        await bot.sendMessage(
            chatId,
            `${e}`
        );
    }
});

bot.onText(/\/trainfullavailability/, async (msg) => {
    const chatId = msg.chat.id;
    if (!whitelistedServiceUsers["train-tickets"].includes(chatId)) return;
    try {
        const fullAvailability = await TrainTicketsService.fullAvailabilityAsMessage();
        await bot.sendMessage(
            chatId,
            fullAvailability,
            { parse_mode: "HTML" }
        );
    } catch (e) {
        console.log(e);
        await bot.sendMessage(
            chatId,
            `${e}`
        );
    }
});

bot.onText(/\/temperature$/, async (msg) => {
    const chatId = msg.chat.id;
    if (!whitelistedServiceUsers["temperature"].includes(chatId)) return;
    try {
        await bot.sendMessage(
            chatId,
            TemperatureService.getTemperatureAsMessage()
        );
    } catch (e) {
        console.log(e);
        await bot.sendMessage(
            chatId,
            `${e}`
        );
    }
});

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