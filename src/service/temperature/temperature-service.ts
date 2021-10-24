const sensor = require('ds18b20-raspi');

const getTemperature = () => sensor.readSimpleC() as number;

const getTemperatureAsMessage = () => {
    const tempC = getTemperature();
    return `${tempC} °C`;
}

export const TemperatureService = {
    getTemperature,
    getTemperatureAsMessage
}