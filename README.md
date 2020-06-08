# Kazubot

### "Let me help you manage your island queues!"
![KazubotIcon](docs/kazubot.jpg?raw=true "Icon")

<a name="About">About</a>
------------------------------
Kazubot manages queues for selling turnips in AC:NH in a conversational and organic way within your Discord server. No need for external websites, spreadsheets, or manual coordination. Just have your community members use the commands below to start their island queues and let Kazubot do the logistics.

![Alt text currently unavailable](docs/KazubotExample.png?raw=true "Example Interaction")

<a name="Setup">Setup</a>
------------------------------
So you want to get Kazubot up and running for your Discord community? Great! It's simple:

Use [this link][invite] to invite Kazubot to your server.

We recommend using the `k!help` command and pinning it to relevant channels in your community so that members can see the available commands. 

<a name="Commands">Commands</a>
------------------------------

| command                                      	| description                                                          	|
|----------------------------------------------	|----------------------------------------------------------------------	|
| k!hi                                         	| check if kazubot is online                                           	|
| k!help                                        | display up list of commands as message on server (good for pinning)   |
| k!start dodocode [visitorLimit] [queueLimit] 	| start a queue: dodocode required, visitor max = 7, queue max = 120   	|
| k!end                                        	| end a queue                                                          	|
| k!join                                       	| join a queue                                                         	|
| k!fly                                        	| fly when departing airport                                           	|
| k!landed                                     	| signal landed when on host island (important for visitor count)      	|
| k!returned                                   	| indicate you've left the host island                                 	|
| k!leave                                      	| leave the queue at any stage                                         	|
| k!island                                     	| see hosted island info                                               	|
| k!queue                                      	| display queue members and order                                      	|
| k!visitors                                   	| show island visitors                                                 	|
| k!remove @handle                             	| remove someone from the queue by @handle (host/admin only)           	|
| k!buffer timeInSeconds                       	| adjust buffer time for flight clearance, max 60 seconds (admin only) 	|

<a name="Support">Support</a>
------------------------------
If you use Kazubot on your discord server, please consider chipping in for our web hosting costs by using the **Sponsor** button at the top of this page. Thank you <3

If you need any help, please feel free to reach out via e-mail here: [funmancers@gmail.com][support email]

<a name="Acknowledgements">Acknowledgements</a>
------------------------------
Kazubot's icon art was created by [@jauxiles][artist] and is used with permission for this application only. 

<!-- Reference Links -->
[support email]: mailto:funmancers@gmail.com
[invite]: https://discordapp.com/oauth2/authorize?client_id=710594126860779625&scope=bot&permissions=1275583681
[artist]: https://twitter.com/jauxiles?lang=en
