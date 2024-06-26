FROM node:20-alpine

RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app

WORKDIR /home/node/app

COPY package*.json ./

COPY .env ./

RUN npm install

COPY --chown=node:node . .

RUN npm run build

CMD [ "node", "build/index.js" ]