import {Client, ITorrent, Torrent} from "transmission-api";

import dotenv from "dotenv";
dotenv.config();

const transmissionClient = new Client("", {
    username: process.env.TRANSMISSION_USERNAME,
    password: process.env.TRANSMISSION_PASSWORD,
});

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

const getAllAsMessage = async () => {
    const torrents = await transmissionClient.getAllTorrents();

    if (torrents.length && !Array.isArray(torrents[0])) {
        return `${torrentsAmountTitle(torrents.length)}
                ${torrents.map(t => torrentDataToDescription(t)).join(
            ``
        )}`
    } else {
        return noTorrents;
    }
}

const add = async (magnetUri: string) => {
    const torrent = await transmissionClient.addTorrent(magnetUri);
    return addedTorrentDataToDescription(torrent);
}

const deleteById = async (id: number) => {
    await transmissionClient.removeTorrent(id, true);
    return `🆔 ${id} deleted`
};

const torrentDataToDescription = (t: Torrent) => `
🆔 ${t.id}
🏷 ${t.name}
${(statePerStatusNumber as any)[t.status.toString()]}
🕒 ${t.eta > 0 ? etaToTimeString(t.eta) : '00:00:00'}
📏 ${numberFormat.format(t.totalSize / (1024 * 1024 * 1024))} GB
🏁 ${numberFormat.format(t.percentDone * 100)}%
🚄 ${numberFormat.format(t.rateDownload / 1000000)} MiB/s
`

const addedTorrentDataToDescription = (torrent: ITorrent) => `
🆔 ${(torrent as any)["torrent-added"].id}
🏷 ${(torrent as any)["torrent-added"].name}
`

const torrentsAmountTitle = (amount: number) => `🔢 ${amount} torrents`

const noTorrents = '🔢 No torrents'

const etaToTimeString = (eta: number) => {
    const date = new Date(0);
    date.setSeconds(eta);
    return date.toISOString().substr(11, 8);
}

export const TorrentService = {
    getAllAsMessage,
    add,
    deleteById,
}