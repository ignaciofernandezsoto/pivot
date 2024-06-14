import {MovieService} from "./service/movie/movie.service";

require('dotenv').config();

import TelegramBot from "node-telegram-bot-api";
import {TorrentService} from "./service/torrent/torrent.service";
import {JobService} from "./service/job/job.service";
import {ServiceType} from "./service/service-type";
import {ErrorResultDto, MoviesDto} from "./service/movie/dto";

const DOWNLOAD_MOVIE_CALLBACK_PREFIX = "CALLBACK_DOWNLOAD_MOVIE_"
const NEXT_MOVIE_CALLBACK_PREFIX = "NEXT_MOVIE_CALLBACK_PREFIX"
const CANCEL_MOVIE_CALLBACK_PREFIX = "CANCEL_MOVIE_CALLBACK"

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

    const movieQuery = match?.at(1);

    try {
        const moviesResult = await MovieService.getAllMovies(movieQuery, 1, 1)

        if (!moviesResult.success) {
            await bot.sendMessage(
                chatId,
                `Unexpected error while fetching movies. Error: ${(moviesResult.data as ErrorResultDto).message}`
            )
        }

        const movies = moviesResult.data as MoviesDto

        const movie = movies.movies[0]

        const movieInfoMessage = (await bot.sendMediaGroup(
            chatId,
            [{type: "photo", media: movie.displayImageUrl, caption: movie.title}],
        ))[0]

        await bot.sendMessage(chatId, 'Choose from the following', {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: 'Download this movie',
                            callback_data: `${DOWNLOAD_MOVIE_CALLBACK_PREFIX}${movie.yifyId}`
                        }
                    ],
                    [
                        {
                            text: 'Next movie',
                            callback_data: `${NEXT_MOVIE_CALLBACK_PREFIX}${movieQuery}_${movies.limit}_${movies.page}_${movieInfoMessage.message_id}`
                        }
                    ],
                    [
                        {
                            text: 'Cancel',
                            callback_data: `${CANCEL_MOVIE_CALLBACK_PREFIX}`
                        }
                    ]
                ]
            }
        })

    } catch (e) {
        console.log(e);
        await bot.sendMessage(
            chatId,
            `${e}`
        );
    }

});

bot.on('callback_query', async (callbackQuery) => {
    const action = callbackQuery.data;

    if (!action) return

    const msg = callbackQuery.message;

    if (!msg) return

    const chatId = msg.chat.id

    if (action.startsWith(DOWNLOAD_MOVIE_CALLBACK_PREFIX)) {
        const movieId = action.split(DOWNLOAD_MOVIE_CALLBACK_PREFIX)[1]
        await bot.sendMessage(chatId, `You picked movie ID ${movieId}`)
        await bot.deleteMessage(chatId, msg.message_id)
    }

    if (action === CANCEL_MOVIE_CALLBACK_PREFIX) {
        await bot.sendMessage(chatId, "Canceled movie search")
        await bot.deleteMessage(chatId, msg.message_id)
    }

    if (action.startsWith(NEXT_MOVIE_CALLBACK_PREFIX)) {
        const [query, limit, page, movieInfoMessageId] = action.split(NEXT_MOVIE_CALLBACK_PREFIX)[1].split("_")

        const moviesResult = await MovieService.getAllMovies(query, parseInt(limit), parseInt(page) + 1)

        if (!moviesResult.success) {
            await bot.sendMessage(
                chatId,
                `Unexpected error while fetching movies. Error: ${(moviesResult.data as ErrorResultDto).message}`
            )
        }

        const movies = moviesResult.data as MoviesDto

        if (!movies.movies || movies.movies.length == 0) {
            await bot.sendMessage(
                chatId,
                "There are no more movies to scroll through"
            )
            await bot.deleteMessage(
                chatId,
                msg.message_id
            )
        }

        const movie = movies.movies[0]

        await bot.editMessageMedia(
            {
                type: "photo",
                media: movie.displayImageUrl,
                caption: movie.title,
            },
            {
                chat_id: chatId,
                message_id: parseInt(movieInfoMessageId),
            }
        )

        await bot.editMessageReplyMarkup(
            {
                    inline_keyboard: [
                        [
                            {
                                text: 'Download this movie',
                                callback_data: `${DOWNLOAD_MOVIE_CALLBACK_PREFIX}${movie.yifyId}`
                            }
                        ],
                        [
                            {
                                text: 'Next movie',
                                callback_data: `${NEXT_MOVIE_CALLBACK_PREFIX}${query}_${movies.limit}_${movies.page + 1}_${movieInfoMessageId}`
                            }
                        ],
                        [
                            {
                                text: 'Cancel',
                                callback_data: `${CANCEL_MOVIE_CALLBACK_PREFIX}`
                            }
                        ]
                    ]
            },
            {
                chat_id: chatId,
                message_id: msg.message_id,
            }
        )
    }

});