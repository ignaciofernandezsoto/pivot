const sensor = require('ds18b20-raspi');

const getTemperatureAsMessage = () => {
    const tempC = sensor.readSimpleC();
    return `${tempC} degC`;
}

export const TemperatureService = {
    getTemperatureAsMessage
}