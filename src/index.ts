import {MovieService} from "./service/movie/movie.service";

require('dotenv').config();

import TelegramBot, {InlineKeyboardMarkup, InputMediaPhoto} from "node-telegram-bot-api";
import {TorrentService} from "./service/torrent/torrent.service";
import {JobService} from "./service/job/job.service";
import {ServiceType} from "./service/service-type";
import {ErrorResultDto, MinimalMovieDataDto, MovieDto, MoviesDto} from "./service/movie/dto";

enum CallbackType {
    DOWNLOAD_MOVIE,
    NEXT_MOVIE,
    CANCEL_MOVIE
}

const MOVIE_DOWNLOAD_DIR = process.env.MOVIE_DOWNLOAD_DIR!;

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

const ytsTrackers = [
    "udp://glotorrents.pw:6969/announce",
    "udp://tracker.opentrackr.org:1337/announce",
    "udp://torrent.gresille.org:80/announce",
    "udp://tracker.openbittorrent.com:80",
    "udp://tracker.coppersurfer.tk:6969",
    "udp://tracker.leechers-paradise.org:6969",
    "udp://p4p.arenabg.ch:1337",
    "udp://tracker.internetwarriors.net:1337"
]

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

    const query = match?.at(1);

    try {

        await getMovie({
            query,
            page: 1,
            telegramData: {
                chatId: chatId,
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

    if (action.startsWith(CallbackType.DOWNLOAD_MOVIE.toString())) {
        const yifyId = action.substring(CallbackType.DOWNLOAD_MOVIE.toString().length)

        const movieResult = await MovieService.getMovie(parseInt(yifyId))

        if (!movieResult.success) {
            await bot.sendMessage(
                chatId,
                `Unexpected error while fetching movie ${yifyId}. Error: ${(movieResult.data as ErrorResultDto).message}`
            )
        }

        const movie = movieResult.data as MinimalMovieDataDto

        const torrentDescription = await TorrentService.add(
            getYtsMagnetUri(movie.torrentHash, movie.title),
            {
                filename: movie.title,
                "download-dir": MOVIE_DOWNLOAD_DIR,
                "priority-high": [],
                "priority-normal": [],
                "priority-low": [],
            },
        )

        await bot.deleteMessage(chatId, msg.message_id)

        await bot.sendMessage(chatId, torrentDescription)
    }

    if (action === CallbackType.CANCEL_MOVIE.toString()) {
        await bot.sendMessage(chatId, "Canceled movie search")
        await bot.deleteMessage(chatId, msg.message_id)
    }

    if (action.startsWith(CallbackType.NEXT_MOVIE.toString())) {

        const [query, page, movieInfoMessageId] = action.substring(CallbackType.NEXT_MOVIE.toString().length).split("_")

        await getMovie({
            query,
            page: parseInt(page) + 1,
            telegramData: {
                chatId: chatId,
                movieInfo: {
                    messageId: parseInt(movieInfoMessageId)
                },
                cta: {
                    messageId: msg.message_id
                }
            }
        })
    }

});

interface TelegramContextData {
    chatId: number,
    movieInfo?: TelegramMessageData,
    cta?: TelegramMessageData,
}

interface TelegramMessageData {
    messageId: number,
}

interface NextMoviePayload {
    query?: string,
    page: number,
    telegramData: TelegramContextData
}

const getMovie: (nextMoviePayload: NextMoviePayload) => Promise<void> =
    async (nextMoviePayload: NextMoviePayload) => {
        const {
            query,
            page,
            telegramData: {chatId, movieInfo: {messageId: pastMovieInfoMessageId} = {}, cta: {messageId: pastCtaMessageId} = {}}
        } = nextMoviePayload

        const moviesResult = await MovieService.getAllMovies(query, 1, page)

        if (!moviesResult.success) {
            await bot.sendMessage(
                chatId,
                `Unexpected error while fetching movies. Error: ${(moviesResult.data as ErrorResultDto).message}`
            )
        }

        const movies = moviesResult.data as MoviesDto

        if (!movies.movies || movies.movies.length == 0) {
            if (pastCtaMessageId) {
                await bot.sendMessage(
                    chatId,
                    "There are no more movies to scroll through"
                )
                await bot.deleteMessage(
                    chatId,
                    pastCtaMessageId
                )
            } else {
                await bot.sendMessage(
                    chatId,
                    "There are no movies that match your given query"
                )
            }
            return
        }

        const movie = movies.movies[0]

        let movieInfoMessageId

        const media: InputMediaPhoto = {
            type: "photo",
            media: movie.displayImageUrl,
            caption: getMovieCaptionHTML(movie),
            parse_mode: "HTML"
        };

        if (pastMovieInfoMessageId) {
            await bot.editMessageMedia(
                media,
                {
                    chat_id: chatId,
                    message_id: pastMovieInfoMessageId,
                }
            )
            movieInfoMessageId = pastMovieInfoMessageId
        } else {
            const movieInfoMessage = (await bot.sendMediaGroup(
                chatId,
                [media],
            ))[0]
            movieInfoMessageId = movieInfoMessage.message_id
        }

        const replyMarkup: InlineKeyboardMarkup = {
            inline_keyboard: [
                [
                    {
                        text: 'Download this movie',
                        callback_data: `${CallbackType.DOWNLOAD_MOVIE}${movie.yifyId}`
                    }
                ],
                [
                    {
                        text: 'Next movie',
                        callback_data: `${CallbackType.NEXT_MOVIE}${query}_${movies.page}_${movieInfoMessageId}`
                    }
                ],
                [
                    {
                        text: 'Cancel',
                        callback_data: `${CallbackType.CANCEL_MOVIE}`
                    }
                ]
            ]
        }

        if (pastCtaMessageId) {
            await bot.editMessageReplyMarkup(
                replyMarkup,
                {
                    chat_id: chatId,
                    message_id: pastCtaMessageId,
                }
            )
        } else {
            await bot.sendMessage(chatId, 'Choose from the following', {
                reply_markup: replyMarkup
            })
        }
    }

const getYtsMagnetUri: (torrentHash: string, movieTitle: string) => string = (torrentHash: string, movieTitle: string) => {
    return `magnet:?xt=urn:btih:${torrentHash}&dn=${encodeURI(movieTitle)}&${ytsTrackers.map(t => `tr=${t}`).join("&")}`
}

const getMovieCaptionHTML = (movie: MovieDto) => `
<b>${movie.title}</b>

<pre>${
    movie.description.length > 768 ? movie.description.substring(0, 768) + "..." : movie.description
}</pre>

📅 Year: ${movie.year}
⭐ Rating: ${movie.rating}
`