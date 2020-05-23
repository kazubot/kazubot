// kazubot is a discord bot for handling queuing and other acnh related tasks

//#region initialization

const config = require('./config.json');
const Discord = require('discord.js');
const client = new Discord.Client();

client.once('ready', () => {
	console.log('Ready!');
});

client.login(config.token);

const queueList = new Array();
const activeVisitors = new Array();
const prefix = "k!"

let active = false;
let hostID;
let dodoCode;
let maxVisitors;
let maxQueueSize;
let visitCount;
let qRemove;

//#endregion

// listening for messages on monitored channels, .on runs multiple times
client.on('message', message => {
	// ignore bot messages
	if (message.author.bot) return;

	// parse message into command and arguments
	const args = message.content.slice(prefix.length).trim().split(/ +/g);
	const command = args.shift().toLowerCase();

	//#region helper functions

	function msgEmbed(title, desc, thumbnail) {
		const Message = new Discord.MessageEmbed()
			.setColor('#FF8362')
			.setTitle(title)
			.setDescription(desc)
			.setThumbnail(thumbnail);
		message.channel.send(Message);
	}

	function printList(listType = 0) {
		// print list
		let userID = listType ? queueList.values() : activeVisitors.values();
		let listMessage = listType ? `Queue order is:` : `Visitor(s) on island:`
		let mention;
		let i = 1;

		for (const display of userID) {
			mention = `<@${display}>`;
			listMessage = listMessage + '\n' + i + ': ' + mention;
			i++;
		}
		msgEmbed(' ', listMessage);
	}

	function printIsland() {
		if (active === true) {
			msgEmbed(`Island opened with queue!`, 
			`**Dodo code: ${dodoCode}**
			\nHost: <@${hostID}>
			\nCurrent visitors: ${activeVisitors.length}
			\nMax concurrent visitors: ${maxVisitors}
			\nMax queue size: ${maxQueueSize}`);	
		}
		else {
			msgEmbed('There is no island queue open right now.');
		}
	}

	//#endregion

	//#region status check functionality

	if (command === 'hi') {
		const msgAuthor = message.author.id;
		const today = new Date();

		// 24h into 12
		if (today.getHours() > 12) {
			msgEmbed(
				':)',
				`Hi <@${msgAuthor}> I'm online now!\n\n ${today.toDateString()}, ${today.getHours() - 12}:${today.getMinutes()}PM`,
				'https://pbs.twimg.com/media/EW-7berUMAEMNke?format=png',
			);
		}
		// 12h is AM
		else {
			msgEmbed(
				':)',
				`Hi <@${msgAuthor}> I'm online!\n\n ${today.toDateString()}, ${today.getHours()}:${today.getMinutes()}AM`,
				'https://pbs.twimg.com/media/EW-7berUMAEMNke?format=png',
			);
		}
	}

	if (command === 'bye') {

		message.channel.send(
			msgEmbed(':(', 'I\'m going offline for now'),
		);
	}

	//#endregion

	//#region queueing functionality

	if (command === 'join') {
		// check if already in queue
		const authorId = message.author.id;

		// if same id is not found in qlist
		if (queueList.indexOf(authorId) === -1) {
			// place message sender's id in list
			queueList.push(authorId);
			msgEmbed(' ', `<@${authorId}> placed in queue list, you are #${queueList.length}`);
			// if first in line
			if (queueList.length === 1) {
				message.channel.send('type `k!fly` to start');
			}
			console.log(`placed ${authorId} in queue in ${queueList.length}`);
		}
		else {
			msgEmbed('You are already in queue!');
		}
	}

	//#region Kick from Queue

	// host can remove members
	if (message.content.startsWith('k!remove') && hostID === message.author.id) {
		// grab mentioned user info
		const remUser = message.mentions.users.first();

		if (remUser) {
			// if user is not in active visitors array
			if (activeVisitors.indexOf(remUser) === -1) {
				// if user is not in queue list
				if (queueList.indexOf(remUser === -1)) {
					msgEmbed('user is not in any queue lists');
				}
				else {
					// if user is in queuelist
					// eslint-disable-next-line no-unused-vars
					qRemove = true;
					msgEmbed('Do you want to remove user  from the Queue List? (Y/N)');
				}
			}
			else {
				// user is in active visitirs array
				// delete entry , remove 1 item at memberindex
				activeVisitors.splice(remUser, 1);
				msgEmbed('removed user from list');
			}
		}
		else {
			msgEmbed('Please mention a user to remove (host only)');
		}
	}

	if (qRemove === true && message.author.id === hostID) {
		input = message.content;

		// if user says yes
		if (input === 'y' || input === 'yes' || input === 'Y') {
			// delete entry , remove 1 item at memberindex
			queueList.splice(remUser, 1);
			msgEmbed('removed user from list');
		}
		else if (input === 'n' || input === 'no' || input === 'N') {
			msgEmbed('okay no one removed');
			return;
		}

	}

	// kick user out of queue
	if (command === 'leavequeue') {
		// var for sent msg user id
		const memberout = message.author.id;
		// testing for match id value
		const memberIndex = queueList.indexOf(memberout);
		// if there is no matching value
		if (memberIndex === -1) {
			msgEmbed('Sorry, you are not in queue!');
		}
		// if there is matching value
		else {
			// delete entry , remove 1 item at memberindex
			queueList.splice(memberIndex, 1);
			msgEmbed(`${memberout}removed from queue`);
			console.log(`removed ${memberout} from queue`);
		}
	}

	//#endregion

	if (command === 'viewlist') {
		// check if queue is empty
		if (queueList.length === 0) {
			msgEmbed('The queue is empty!');
		}
		else {
			printList(1);
		}
	}

	if (command === 'viewvisitors') {
		// check if queue is empty
		if (activeVisitors.length === 0) {
			msgEmbed(``, `There are no visitors on the island.`);
		}
		else {
			printList(0);
		}
	}

	if (message.content.startsWith('k!start')) {
		// store author id
		// end command only executable by this user
		// checks if an island is running
		if (active === false) {
			hostID = message.author.id;
			dodoCode = args[0];
			maxVisitors = !isNaN(args[1]) ? Math.abs(args[1]) : 7; // 7 is max capacity for visitors in AC:NH
			maxQueueSize = !isNaN(args[2]) ? Math.abs(args[2]) : 120; // 120 is a good ceiling for a PM turnip selling queue

			if (!dodoCode || maxVisitors > 7 || maxQueueSize > 120) {
				// queue arguments passed in message are unacceptable
				msgEmbed(`You requested a queue with missing or incorrect values, try again!`, 
				`Format: \`k!start dodoCode concurrentVisitorLimit queueSizeLimit\`
				\n Values: Concurrent Visitor Maximum = 7 | Queue Size Maximum = 120`);
			}
			else {
				// valid arguments passed for queue
				active = true;
				printIsland();
				message.channel.send('When ready, join the queue with: `k!join`');
				console.log(`Island opening with maxVisitors: ${maxVisitors}`);
			}
		}
		else {
			message.channel.send('An island is already being hosted');
			return;
		}
	}

	if (command === 'island') {
		printIsland();
	}

	if (command === 'fly') {
		// post dodocode again and cleared to fly
		// save authorid in either array
		const flyerID = message.author.id;

		// should only pull from Queuelist array
		// if activevisitors array is less or equal to max allowed on island
		if (activeVisitors.length <= maxVisitors) {
			// if first in queuelist line
			// then can fly in
			if (flyerID === queueList[0]) {
				// if no dodo code
				if (dodoCode === 0) {

					msgEmbed(' ', `<@${flyerID}> is flying! Enter \`k!landed\` once you've touched down successfully`);
					console.log(`flying in ${flyerID}`);
				}
				// if dodo code
				else {
					msgEmbed(' ', `<@${flyerID}> is flying! The dodo code once again is || ${dodoCode} || \n Enter \`k!landed\` once you've touched down successfully`);
					console.log(`flying in ${flyerID}`);
				}

			}
			// if id does not match first in line
			else {
				msgEmbed('Sorry! You are not first in line!');
				printList(1);
			}
		}
		else {
			msgEmbed('Sorry! The island is full! Please wait until someone leaves');
			return;
		}
	}

	if (command === 'landed') {
		// prompt following user to fly
		const currentId = message.author.id;
		// flyer id matches first in line
		if (currentId === queueList[0]) {
			// save next flier variable
			const nextID = queueList[1];

			// if there no more ids
			if (!nextID) {
				msgEmbed('Queue is now empty!', ' ');
				visitCount = visitCount + 1;
				// move flyerid to active visitors array
				activeVisitors.push(currentId);
				queueList.splice(0, 1);

				console.log(`visit count:${visitCount}`);
			}
			// if more in line
			else {
				// count +1 on island
				visitCount = visitCount + 1;
				msgEmbed(' ', `<@${nextID}> you are clear for takeoff! Enter \`k!landed\` once you've touched down successfully`);
				console.log(`prompting next flier ${nextID} and +1 to visitcount: ${visitCount}`);
				// move flyerid to active visitors array
				activeVisitors.push(currentId);
				queueList.splice(0, 1);

				// if island is full push the message
				if (visitCount === maxVisitors) {
					msgEmbed('Island is now full, next flier will be prompted once someone leaves\nVisitors please remember to enter `k!returned` once you\'ve left');
				}
			}
		}
		// flyer id does not match
		else {
			msgEmbed('Sorry you are not currently flying!');
			return;
		}
	}

	if (command === 'returned') {
		const retID = message.author.id;
		const retIDIndex = activeVisitors.indexOf(retID);

		// no matching value
		if (retIDIndex === -1) {
			msgEmbed('you are not on the island');
		}
		else {
			// remove id from activevisitors
			activeVisitors.splice(retIDIndex, 1);
			msgEmbed(' ', `<@${retID}> has returned home`);
			visitCount = visitCount - 1;
			// prompt next flier if anyone is on the list
			if (queueList.length > 0) {
				msgEmbed(' ', `<@${queueList[0]}> you are clear for takeoff! Enter \`k!landed\` once you've touched down successfully`);
			}
			// else the list is empty
			else {
				msgEmbed(' ', 'Everyone has left!');
			}
		}

	}

	if (command === 'end') {
		// island is closed
		const endID = message.author.id;
		console.log(`end command ${endID} host was ${hostID}`);
		// check your id is host id
		if (endID === hostID) {
			// clear queue
			queueList.fill(0);

			msgEmbed(' ', 'Queue has been cleared! Thank you for hosting!');
			// reopened new island requests
			active = false;
			dodoCode = 0;
			console.log('queue cleared, room closed');
		}
		// not host id
		else {
			msgEmbed('Sorry you are not the host!');
			console.log('non host tried to close room');
		}
	}

	if (command === 'queuehelp') {
		const helpMessage = new Discord.MessageEmbed()
			.setColor('#FF8362')
			.setTitle('Queue Commands')
			.setDescription('Hi I\'m Kazuma bot, Ren built me!\n This is her first time making something in Javascript! Please let her know about any bugs!')
			.addFields(
				{ name:'\u200B', value:'`k!start dodocode`\n to start a queue as an island host\neg: k!start F3GR3' },
				{ name:'\u200B', value:'`k!join`\n to join the queue' },
				{ name:'\u200B', value:'`k!island`\n to see the open island info again' },
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

	//#endregion

});
