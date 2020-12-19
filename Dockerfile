# Node JS Version
FROM node:12.18.2-alpine3.9
LABEL name='Kazubot'
LABEL version='1.0.1'

# Using Secrethub
RUN apk update && apk add --repository https://alpine.secrethub.io/alpine/edge/main --allow-untrusted secrethub-cli

# Environment variables
ENV SECRETHUB_CREDENTIAL = ""
ENV SECRETHUB_TOKEN_PATH = "secrethub://username/repo/token"
ENV SCRIPT = "bot"

# Setup working directory
WORKDIR /usr/src/app
COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]

# Install node dependencies
RUN npm install

COPY . .

EXPOSE 3000

CMD secrethub run -e TOKEN=$SECRETHUB_TOKEN_PATH -- npm run $SCRIPT
