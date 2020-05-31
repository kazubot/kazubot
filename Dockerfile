FROM node:12.17.0-alpine3.9
RUN apk update && apk add --repository https://alpine.secrethub.io/alpine/edge/main --allow-untrusted secrethub-cli
WORKDIR /usr/src/app
COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]
RUN npm install --production --silent && mv node_modules ../
COPY . .
EXPOSE 3000
CMD secrethub run --var env=local -- node src/js/bot.js