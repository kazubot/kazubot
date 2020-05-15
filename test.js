//connect to config.json
// require the discord.js module
const config = require('./config.json');
const Discord = require('discord.js');
const fs = require('fs');

// create a new Discord client
const client = new Discord.Client();

// when the client is ready, run this code
// this event will only trigger one time after logging in
client.once('ready', () => {
    console.log('Ready!');
});

//the 2 id storage arrays 
let IdStorage = new Array();
let activeFliers = new Array(3);
//indicator for open islands 
let active = false;
var dodoCode = 0;
var hostID;
var opening=false;
var maxAllow;
var visitCount=0;

//check island is still open
function timedOut() {
    //message.channel.send(`3 hours have passed, island opened by ${hostID} is now closed`);
    active = false;
    dodoCode = 0;
    console.log(`island opened by ${hostID} timed out`);
    //clear user nickname back to normal
    hostID.setNickname(hostName);
    hostID = 0;
}

function msgEmbed(type,title,desc,thumbnail,footer) {
    if(type === 'system') {
        footer='Ren K#6666';
    }
    else
    {
        footer = " ";
    const Message = new Discord.MessageEmbed()
        .setColor('#FF8362')
        .setTitle(title)
        .setDescription(desc) 
        .setThumbnail(thumbnail)
        .setFooter(footer);

    return Message;
    }
}

//checking messages, .on runs multiple times
client.on('message', message => {
    //auto check for prefix and ignore sent by bots
    if(!message.content.startsWith('k!')||message.author.bot) return;

    if(message.content === 'k!hi') {
        let msgAuthor = message.author.id;
        let today = new Date();

       
        //24h into 12
        if(today.getHours()>12) {

            message.channel.send(
                msgEmbed(
                    'system',
                    ':)',
                    `Hi <@${msgAuthor}> I'm online now!\n\n ${today.toDateString()}, ${today.getHours()-12}:${today.getMinutes()}PM`,
                    'https://pbs.twimg.com/media/EW-7berUMAEMNke?format=png',
                )
            );
        }
        //12h is AM
        else {
            message.channel.send(  
                msgEmbed(
                    'system',
                    ':)',
                    `Hi <@${msgAuthor}> I'm online!\n\n ${today.toDateString()}, ${today.getHours()}:${today.getMinutes()}AM`,
                    'https://pbs.twimg.com/media/EW-7berUMAEMNke?format=png',
                )
            ); 
        }       
    }

    if(message.content === 'k!bye') {

        message.channel.send(
            msgEmbed('system',':(','I\'m going offline for now')
        );
    }

    //check for join queue command
    if (message.content === 'k!join') {
        //check if already in queue
        let memberin = message.author.id; //assign id to variable

        //if same id is not found
        if(IdStorage.indexOf(memberin) === -1) {
            //place message sender's id in list 
            IdStorage.push(message.author.id);
            message.reply (`placed in queue list, you are #${IdStorage.length}`);
            //if first in line
            if(IdStorage.length === 1) {
                message.channel.send('type `k!fly` to start');
            }
            console.log(`placed ${message.author.username} in queue in ${IdStorage.length}`);
        }
        //if same ID is found 
        else{
            message.channel.send(`You are already in queue!`);
        }
    }

    //kick user out of queue
    if(message.content === 'k!leavequeue') {
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
            hostName = message.author.username;
            dodoCode = message.content.slice(8);

            if(!dodoCode) {
                //no dodocode
                message.channel.send('Did you enter a dodo code?');
            }
            else
            {
                //dodocode check cleared 
                message.channel.send("enter the maximum # of visitors you want on your island at once!\nLike this: `k!max 8`");
                //opening in progress, helps trigger next command
                opening=true;
                console.log(`room opening ${hostID} ${hostName} dodocode: ${dodoCode} opening:${opening}`);
            }
    
        }
        else
        {
            message.channel.send('An island is already being hosted');
            return;
        }
    }

    if(message.content.startsWith('k!max') && opening === true) {
        maxAllow = message.content.slice(6);
        if(message.author.id === hostID && !isNaN(maxAllow)) {
            console.log(`room opening maxallow ${maxAllow}`);

            message.channel.send(
                msgEmbed("",`Queue for ${hostName} has been opened!`,`**DODO CODE**: ${dodoCode}\nMax visitors: ${maxAllow}`)
            );
            message.channel.send('Join the Queue with: `k!join`');
            //timer for 3 hours
            setTimeout(timedOut, 10800000);
        }
        else {
            message.reply('Please enter a number');
        }
    }

    if(message.content === 'k!fly') {
        //post dodocode again and cleared to fly
        //save author id
        let flyerID = message.author.id;
        let flyerName = message.author.username;
       
        //if there is space on island
        if(visitCount < maxAllow) {
            //if id matches first in line id
            if(flyerID === IdStorage[visitCount]) {
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
        else {
            message.channel.send('Sorry! island is full! Please wait until someone leaves');
            return;
        }
    }

    if(message.content === 'k!landed') {
        //grab key and remove user from line
        //prompt following user to fly
        let curID = message.author.id;
        //flyer id matches first in line 
        if (curID === IdStorage[visitCount])
        {
            //save next flier variable
            let nextID = IdStorage[visitCount+1];

            //if there no more ids
            if(!nextID)
            {
                message.channel.send('Queue is now empty!')
            }
            //if more in line
            else
            {
                visitCount = visitCount+1;
                message.channel.send(`<@${nextID}> you are clear for takeoff! Enter \`k!landed\` once you've touched down successfully`);
                console.log(`prompting next flier ${nextID} and +1 to visitcount: ${visitCount}`);
            }  
        }
        //flyer id does not match
        else
        {
            message.channel.send('Sorry you are not currently flying!');
            return;
        }
    }

    if(message.content === 'k!returned') {
        let retID = message.author.id;
        let retIDIndex = IdStorage.indexOf(retID);

        //no matching value
        if(retIDIndex === -1) {
            message.reply('you are not on the island')
        }
        else {
            IdStorage.splice(retIDIndex, 1);
            message.reply (`removed from queue`);
            visitCount = visitCount-1;    
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
                { name:'\u200B', value:'`k!returned`\n to tell the bot you\'ve returned home' },
                { name:'\u200B', value:'`k!end`\n to tell the bot you are closing your island. (Empties queue)' },
                { name:'\u200B', value:'`k!leavequeue`\n to leave to queue' },
                { name:'\u200B', value:'`k!viewlist`\n to see the queue list' },
            )
            .setFooter('Ren K#6666');

    message.channel.send(helpMessage);
    }

/**
    wishlist section not working yet 
        - append on new line every time 
        - if item=nothing then error message 
        - search text files ?

        idea !!! universal wishlist txt
            - ignore duplicate entries and store author id
            - ping stored ids when item is offered 
**/

    if(message.content.startsWith('k!wishlist')) {
        let authorID = message.author.id;
        let item = message.content.slice(11);

        fs.appendFile(`H:\\Google Drive\\ACTIVE\\KazuBot\\wishlists\\${authorID}.txt`,item, (err) => {
            if(err) throw err;
        })

        message.reply(`${item} has been added to your wishlist`)
    }

    if(message.content === 'k!mywishlist') {
        let authorID = message.author.id;
        let authorName = message.author.username;
        let data;

        fs.readFile(`H:\\Google Drive\\ACTIVE\\KazuBot\\wishlists\\${authorID}.txt`, (err, data) => {
            if (err) throw err;

        const wishlistMessage = new Discord.MessageEmbed()
            .setColor('#FF8362')
            .setTitle(`${authorName}'s wishlist`)
            .setDescription(data) 
            .setFooter('List cleared every week');

        message.channel.send(wishlistMessage);

        })
    }


});

// test bot token
client.login(config.testToken);