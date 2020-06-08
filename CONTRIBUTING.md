# Contributing to Kazubot

So you want to contribute to Kazubot's development? Neat! Here's what you'll need to do to get started. 

1. Request write permission to the Kazubot repo by contacting the CODEOWNERS [here][contact].

2. Follow [this short guide][discord] to set up a Discord bot, name it, and grab its unique Token. You will use this Token as your test version of the bot, so it doesn't conflict with the bot that is currently serving discord communities (the production bot: Kazubot | Cloud). 

3. Invite your bot to your Discord server, [like so][invite].

4. Sign up for [Secrethub][secrethub] and store your Token safely using it, following steps 1 -> 3. Also, know where your secrethub credential lives on your machine, you will need this location later. (Leave passphrase blank during creation if you want to avoid issues with the commands below)

5. Let's test that you've got the necessary pre-requisites working. Run this command, substituting the `username` with your secrethub username and `repo/token` with the repository name and secret name you stored your token as in the previous step. 

`secrethub run -e TOKEN=secrethub://username/repo/token -- npm run test`

If this command works, you should see something like this:
![Alt text currently unavailable](docs/TestResults.png?raw=true "Test Results")

6. Now you're ready to start making your own changes. Always make changes on a new git branch, named something relevant to the issue you're trying to solve. 

Run the bot locally using this command: `secrethub run -e TOKEN=secrethub://username/repo/token -- npm run bot`, this will allow you to test manually on any discord server your version of the bot is invited to. 

Either have ESLint set up in your IDE, or run this command before checking in to make sure you have no syntax errors: `npm run lint`

Run automated tests locally using this command: `secrethub run -e TOKEN=secrethub://username/repo/token -- npm run test` 

7. When you're ready to submit your changes, commit, push, and open a Pull Request on GitHub. GitHub Actions will run CI, linting, functional tests, and build and publish a docker image of your change if there are no failures in the tests/build. A CODEOWNER review is required for merging to master. 

8. Updating the Kazubot | Cloud version of the application will be handled by a CODEOWNER.

<!-- Reference Links -->
[contact]: mailto:funmancers@gmail.com
[discord]: https://discordjs.guide/preparations/setting-up-a-bot-application.html
[invite]: https://discordjs.guide/preparations/adding-your-bot-to-servers.html
[secrethub]: https://console.kumo.expedia.biz/apps/ursa/pipeline
[docker]: https://docs.docker.com/get-docker/
