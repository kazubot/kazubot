# Node JS Version
FROM node:12.17.0-alpine3.9

# Using Secrethub
RUN apk update && apk add --repository https://alpine.secrethub.io/alpine/edge/main --allow-untrusted secrethub-cli

# Environment variables
ENV SECRETHUB_CREDENTIAL = ""
ENV SECRETHUB_TOKEN_PATH = "secrethub://username/repo/token"

# Setup working directory
WORKDIR /usr/src/app
COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]

# Install node dependencies
RUN npm install --production --silent && mv node_modules ../
RUN npm install pm2 -g --no-optional

COPY . .

EXPOSE 3000

CMD secrethub run -e TOKEN=$SECRETHUB_TOKEN_PATH -- npm run bot