FROM node:12.17.0-alpine3.9
ARG RUN_ENVIRONMENT=prod
ENV ENVIRONMENT=$RUN_ENVIRONMENT
RUN apk update && apk add --repository https://alpine.secrethub.io/alpine/edge/main --allow-untrusted secrethub-cli
WORKDIR /usr/src/app
COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]
RUN npm install --production --silent && mv node_modules ../
RUN npm install pm2 -g
COPY . .
EXPOSE 3000
CMD secrethub run --var ENVIRONMENT=$ENVIRONMENT -- pm2 start src/js/bot.js --name kazubot --time