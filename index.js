//connect to config.json
// require the discord.js module
const config = require('./config.json');
const Discord = require('discord.js');

// create a new Discord client
const client = new Discord.Client();

// when the client is ready, run this code
// this event will only trigger one time after logging in
client.once('ready', () => {
    console.log('Ready!');
});

let IdStorage = new Array();
let activeFliers = new Array(4);
//indicator for open islands 
let active = false;
var dodoCode = 0;
var hostID;

//checking messages, .on runs multiple times
client.on('message', message => {
    //auto check for prefix and ignore sent by bots
    if(!message.content.startsWith('k!')||message.author.bot) return;

    if(message.content === 'k!hi') {
        let msgAuthor = message.author.id;
        let today = new Date();

        //24h into 12
        if(today.getHours()>12) {
            //display pm message embed
            const helloMessage = new Discord.MessageEmbed()
            .setColor('#FF8362')
            .setTitle(':)')
            .setDescription(`Hi <@${msgAuthor}> I'm online now!\n\n ${today.toDateString()}, ${today.getHours()-12}:${today.getMinutes()}PM`) 
            .setThumbnail('https://pbs.twimg.com/media/EW-7berUMAEMNke?format=png')
            .setFooter('Ren K#6666');

            message.channel.send(helloMessage);
        }
        //12h is AM
        else {
            const helloMessage = new Discord.MessageEmbed()
            .setColor('#FF8362')
            .setTitle(':)')
            .setDescription(`Hi <@${msgAuthor}> I'm online!\n\n ${today.toDateString()}, ${today.getHours()}:${today.getMinutes()}AM`)
            .setThumbnail('https://pbs.twimg.com/media/EW-7berUMAEMNke?format=png')
            .setFooter('Ren K#6666');

            message.channel.send(helloMessage);
            
        }
        
    }

    if(message.content === 'k!bye') {

        const byeMessage = new Discord.MessageEmbed()
            .setColor('#FF8362')
            .setTitle(':(')
            .setDescription(`I'm going offline for now`) 
            .setFooter('Ren K#6666');

        message.channel.send(byeMessage);
    }

    //check for join queue command
    if (message.content === 'k!join') {
        //check if already in queue
        let memberin = message.author.id; //assign id to var

        //if same id is not found
        if(IdStorage.indexOf(memberin) === -1) {
            //place message sender's id in list 
            IdStorage.push(message.author.id);
            message.reply (`placed in queue list, you are #${IdStorage.length}`);
            //if first in line
            if(IdStorage.length === 1) {
                message.channel.send('type `k!fly` to start');
            }
            console.log(`placed ${message.author.username} in queue`);
        }
        //if same ID is found 
        else{
            message.channel.send(`You are already in queue!`);
        }
    }

    //kick user out of queue
    if(message.content === 'k!leave') {
        //var for sent msg user id    
        let memberout = message.author.id;
        //testing for match id value
        let memberIndex = IdStorage.indexOf(memberout);
        //if there is no matching value 
        if(memberIndex === -1) {
            message.reply(`Sorry, you are not in queue!`);
        }
        //if there is matching value
        else{
            //delete entry , remove 1 item at memberindex 
            IdStorage.splice(memberIndex, 1);
            message.reply (`removed from queue`);
            console.log(`removed ${message.author.username} from queue`);
        }
    }

    if(message.content === 'k!viewlist') {
        //check if queue is empty
        if(IdStorage.length === 0) {
            message.channel.send(`Queue is empty!`)
        }
        else //if not empty 
        {
            //print user list
            let userID = IdStorage.values();
            let mention;
            let i = 1;
            for(let display of userID) {
                //create mention string 
                mention = `<@${display}>`;
                message.channel.send(`${i}: ${mention}`);
                i++;
            }
        }
        
    }     


    if(message.content.startsWith('k!start')) {
        //store author id
        //end command only executable by this user or timer
        //checks if an island is running
        if(active === false)
        {
            hostID = message.author.id;
            let hostName = message.author.username;
            dodoCode = message.content.slice(8);
            
            console.log(`room opened ${hostID} ${hostName} ${dodoCode}`);
    
            if(!dodoCode) {
                message.channel.send('Did you enter a dodo code?');
                return;
            }
            else
            {
                const openMsg = new Discord.MessageEmbed()
                    .setColor('#FF8362')
                    .setTitle('Queue for '+ hostName +' has been opened!')
                    .setDescription('**DODO CODE**: '+ dodoCode);
                message.channel.send(openMsg);
                message.channel.send('Join the Queue with: `k!join` and enter `k!fly` when you are ready');
                //active var prevents more islands from opening 
                active = true;
            }
    
        }
        else
        {
            message.channel.send('An island is already being hosted');
            return;
        }
            
       

    }

    if(message.content === 'k!fly') {
        //post dodocode again and cleared to fly
        //save author id
        let flyerID = message.author.id;
        let flyerName = message.author.username;
       
        //if id matches first in line id
        if(flyerID === IdStorage[0]) {
            //if no dodo code
            if(dodoCode === 0) {
                message.reply(`you are cleared to fly! Enter \`k!landed\` once you've touched down successfully`);
                console.log(`flying in ${flyerID} ${flyerName}`);
            }
            //if dodo code
            else
            {
                message.channel.send(`${flyerName} you are cleared to fly! The dodo code once again is || ${dodoCode} ||\n Enter \`k!landed\` once you've touched down successfully`);
                console.log(`flying in ${flyerID} ${flyerName}`);
            }
            
        }
        //if id does not match first in line
        else
        {
            message.channel.send('Sorry! you are not first in line!');
            return;
        }
        
    }

    if(message.content === 'k!landed') {
        //grab key and remove user from line
        //prompt following user to fly
        let curID = message.author.id;
        //flyer id matches first in line 
        if (curID === IdStorage[0])
        {
            //save flier to second array
            activeFliers.push(curID);
            //save next flier variable
            let nextID = IdStorage[1];
            //delete 1 item in index 0 
            IdStorage.splice(0, 1);
            //if there no more ids
            if(!nextID)
            {
                message.channel.send('Queue is now empty!')
            }
            //if more in line
            else
            {
                message.channel.send(`<@${nextID}> you are clear for takeoff! Enter \`k!landed\` once you've touched down successfully`);
                console.log(`prompting next flier ${nextID}`);
                
                
            }  
        }
        //flyer id does not match
        else
        {
            message.channel.send('Sorry you are not currently flying!');
            console.log(`non flier executed landing`);
            return;
        }
    }

    if(message.content === 'k!end') {
        //island is closed
        let endID = message.author.id;
        console.log(`end command ${endID} host was ${hostID}`)
        //check your id is host id
        if(endID === hostID) {
            //clear queue
            IdStorage.fill(0);

            message.channel.send('Queue has been cleared! Thank you for hosting!');
            //reopened new island requests
            active = false;
            dodoCode = 0;
            console.log('queue cleared, room closed');
        }
        //not host id 
        else
        {
            message.channel.send('Sorry you are not the host!');
            console.log('non host tried to close room');
        }
    }

    if(message.content === 'k!queuehelp') {
        const helpMessage = new Discord.MessageEmbed()
            .setColor('#FF8362')
            .setTitle('Queue Commands')
            .setDescription('Hi I\'m Kazuma bot, Ren built me!\n This is her first time making something in Javascript! Please let her know about any bugs!') 
            .addFields(
                { name:'\u200B', value:'`k!start dodocode`\n to start a queue as an island host\neg: k!start F3GR3' },
                { name:'\u200B', value:'`k!join`\n to join the queue' },
                { name:'\u200B', value:'`k!fly`\n to tell the bot you are present and ready to fly in' },
                { name:'\u200B', value:'`k!landed`\n to tell the bot you\'ve landed on the island' },
                { name:'\u200B', value:'`k!end`\n to tell the bot you are closing your island. (Empties queue)' },
                { name:'\u200B', value:'`k!leave`\n to leave to queue' },
                { name:'\u200B', value:'`k!viewlist`\n to see the queue list' },
            )
            .setFooter('Ren K#6666');

    message.channel.send(helpMessage);
    }
});

// login to Discord with your app's token
client.login(config.token);