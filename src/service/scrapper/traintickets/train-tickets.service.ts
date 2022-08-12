import axios from "axios";
import jsdom from "jsdom";
import qs from 'qs';
import dateFormat from "dateformat";

const {JSDOM} = jsdom;

type Availability = {
    outbound: Bound[],
    inbound: Bound[],
}

type Bound = {
    date: string,
    seats: number,
}

const LOCAL_DATE_FORMAT = "dd/mm/yyyy"

const fullAvailabilityAsMessage: (maybeFullAvailability?: Availability) => Promise<string> =
    async (maybeFullAvailability?) => {

        const fullAvailability = maybeFullAvailability ?? await fetchFullAvailability();

        return availabilityDescription(fullAvailability);

    }

const availabilityAsMessage: (startDate: Date, endDate: Date) => Promise<string> =
    async (startDate, endDate) => {

        const availability = await fetchAvailability(startDate, endDate);

        return availabilityDescription(availability);

    }

const fetchFullAvailability: () => Promise<Availability> =
    async () => {

        const dates = [];

        for (let i = 1; i < 10; i++) {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() + 7 * i);

            const endDate = new Date();
            endDate.setDate(startDate.getDate() + 7 * i);

            dates.push({
                startDate,
                endDate
            })
        }

        const allAvailabilities = await Promise.all(dates.map(({
                                                                   startDate,
                                                                   endDate
                                                               }) => fetchAvailability(startDate, endDate)))

        return allAvailabilities.reduce(
            (previousValue, currentValue) => ({
                outbound: previousValue.outbound.concat(currentValue.outbound),
                inbound: previousValue.inbound.concat(currentValue.inbound)
            })
        )

    }

const fetchAvailability: (startDate: Date, endDate: Date) => Promise<Availability> =
    async (startDate: Date, endDate: Date) => {

        const formattedStartDate = dateFormat(startDate, LOCAL_DATE_FORMAT);
        const formattedEndDate = dateFormat(endDate, LOCAL_DATE_FORMAT);

        const data = {
            busqueda: {
                cantidad_pasajeros: {bebe: "0", adulto: "1", jubilado: "0", menor: "0"},
                tipo_viaje: "2",
                origen: "481", // Buenos Aires
                destino: "255", // MDQ: 255, Lujan: 247
                fecha_ida: formattedStartDate,
                fecha_vuelta: formattedEndDate
            }
        }

        const rawResponse = await axios("https://webventas.sofse.gob.ar/calendario.php", {
            "headers": {
                "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,/;q=0.8,application/signed-exchange;v=b3;q=0.9",
                "accept-language": "es-ES,es;q=0.9,en;q=0.8",
                "cache-control": "max-age=0",
                "content-type": "application/x-www-form-urlencoded",
            },
            "data": qs.stringify(data),
            "method": "POST",
        });
        const dom = new JSDOM(rawResponse.data);

        try {
            return scrapeData(dom)
        } catch (e) {
            console.log(`Got error=[${e}] while scraping data on dates startDate=[${startDate}] and endDate=[${endDate}]`)
            return {
                outbound: [],
                inbound: [],
            }
        }

    }

const scrapeData = (dom: jsdom.JSDOM) => {

    return {
        outbound: scrapeBoundedData(dom, "calendario_ida", "dia_numero", "disponibles"),
        inbound: scrapeBoundedData(dom, "calendario_vuelta", "dia_numero", "disponibles"),
    }

}

const scrapeBoundedData = (dom: jsdom.JSDOM, boundElementIdName: string, availableDateElementClassName: string, availableSeatsElementClassName: string) =>
    Array.from(
        Array.from(
            dom.window.document.getElementById(boundElementIdName)!.getElementsByClassName("web")
        )[0].getElementsByClassName("dia_disponible")
    )
        .map(e => [e.getElementsByClassName(availableDateElementClassName), e.getElementsByClassName(availableSeatsElementClassName)])
        .map(e => e.map(p => p.item(0)))
        .map(e => e.map(p => p?.textContent?.replace(/(\r\n|\n|\r|\t)/gm, "")))
        .map(e => ({
            date: e[0] ?? "Unknown Date",
            seats: parseInt(e[1]?.replace(/\D/g, '') ?? "0"),
        }));


const availabilityDescription: (availability: Availability) => string =
    ({outbound, inbound}) => {

        if (!outbound.concat(inbound).length) return "Sorry! There are no available train rides 😥"

        let description = "";

        if (outbound.length) {
            description +=
                `🛫 <b>Available outbound trips</b>\n
${boundsDescription(outbound)}`;
        }

        if (inbound.length) {
            description += (description ? "\n\n\n" : "") +
                `🛬 <b>Available inbound trips</b>\n
${boundsDescription(inbound)}`;
        }

        description += "\n\n\nFor more information, check <a href=\"https://webventas.sofse.gob.ar/\">this site out</a>";

        return description;
    }

const boundsDescription: (bounds: Bound[]) => string =
    bounds => bounds.map(b => boundDescription(b)).join("\n")

const boundDescription: (bound: Bound) => string =
    ({date, seats}) => `${date}: ${seats} asientos`

export const TrainTicketsService = {
    fullAvailabilityAsMessage,
    availabilityAsMessage,
    fetchFullAvailability,
}