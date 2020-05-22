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

let active = false;
let dodoCode = 0;
let hostID;
let opening = false;
let maxAllow = 8;
let visitCount = 0;
let qRemove;

//#endregion

// listening for messages on monitored channels, .on runs multiple times
client.on('message', message => {

	function msgEmbed(title, desc, thumbnail) {
		const Message = new Discord.MessageEmbed()
			.setColor('#FF8362')
			.setTitle(title)
			.setDescription(desc)
			.setThumbnail(thumbnail);
		message.channel.send(Message);
	}

	//#region status check functionality

	if (message.content === 'k!hi') {
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

	if (message.content === 'k!bye') {

		message.channel.send(
			msgEmbed(':(', 'I\'m going offline for now'),
		);
	}

	//#endregion

	//#region queueing functionality

	if (message.content === 'k!join') {
		// check if already in queue
		const memberin = message.author.id;
		const memberName = message.author.username;

		// if same id is not found in qlist
		if (queueList.indexOf(memberin) === -1) {
			// place message sender's id in list
			queueList.push(message.author.id);
			msgEmbed(' ', `${memberName} placed in queue list, you are #${queueList.length}`);
			// if first in line
			if (queueList.length === 1) {
				message.channel.send('type `k!fly` to start');
			}
			console.log(`placed ${memberName} in queue in ${queueList.length}`);
		}
		else {
			msgEmbed('You are already in queue!');
		}
	}

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
					msgEmbed('Do you want to remove user from the Queue List? (Y/N)');
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
	if (message.content === 'k!leavequeue') {
		// var for sent msg user id
		const memberout = message.author.id;
		const memberoutName = message.author.username;
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
			msgEmbed(`${memberoutName}removed from queue`);
			console.log(`removed ${message.author.username} from queue`);
		}
	}

	if (message.content === 'k!viewlist') {
		// check if queue is empty
		if (queueList.length === 0) {
			msgEmbed('Queue is empty!');
		}
		else {
			printList(1);
		}
	}

	function printList(listType = 0) {
			// print list
			const userID = isQueue ? queueList.values() : activeVisitors.values();
			let mention;
			let i = 1;
			let listMessage = 'Queue order is...';

			for (const display of userID) {
				mention = `<@${display}>`;
				listMessage = listMessage + '\n' + i + ': ' + mention;
				i++;
			}
			msgEmbed(' ', listMessage);
	}

	if (message.content === 'k!viewvisitors') {
		// check if queue is empty
		if (activeVisitors.length === 0) {
			msgEmbed('No one is on the island', ' ');
		}
		else {
			printList(0);
		}
	}

	if (message.content.startsWith('k!start')) {
		// store author id
		// end command only executable by this user or timer
		// checks if an island is running
		if (active === false) {
			hostID = message.author.id;
			hostName = message.author.username;
			dodoCode = message.content.slice(8);

			if (!dodoCode) {
				// no dodocode
				msgEmbed(' ', 'Did you enter a dodo code?');
			}
			else {
				// dodocode check cleared
				msgEmbed('Enter the maximum # of visitors you want on your island at once!',
					'Like this: `k!max 8`\n\nRecommended number for Turnips: 4');
				active = true;
				// opening in progress, helps trigger next command
				opening = true;
				console.log(`room opening ${hostID} ${hostName} dodocode: ${dodoCode} opening:${opening}`);
			}

		}
		else {
			message.channel.send('An island is already being hosted');
			return;
		}
	}

	if (message.author.id === hostID && opening === true) {
		maxAllow = message.content;

		if (!isNaN(maxAllow)) {
			console.log(`room opening maxallow ${maxAllow}`);

			msgEmbed(`Queue for ${hostName} has been opened!`, `**DODO CODE**: ${dodoCode}\nMax visitors at once: ${maxAllow}`);

			message.channel.send('Join the Queue with: `k!join`');
			// close the command
			opening = false;
			// timer for 3 hours
			setTimeout(timedOut, 10800000);
		}
	}

	if (message.content === 'k!island') {
		// see island msgEmbed again
		if (active === true) {
			msgEmbed(`${hostName}'s island is open!`, `**DODO CODE**: ${dodoCode}\nMax visitors at once: ${maxAllow}`);
		}
		else {
			msgEmbed('There is no island open right now');
		}
	}

	if (message.content === 'k!fly') {
		// post dodocode again and cleared to fly
		// save authorid in either array
		const flyerID = message.author.id;
		const flyerName = message.author.id.username;

		// should only pull from Queuelist array
		// if activevisitors array is less or equal to max allowed on island
		if (activeVisitors.length <= maxAllow) {
			// if first in queuelist line
			// then can fly in
			if (flyerID === queueList[0]) {
				// if no dodo code
				if (dodoCode === 0) {

					msgEmbed(' ', `<@${flyerID}> is flying! Enter \`k!landed\` once you've touched down successfully`);
					console.log(`flying in ${flyerID} ${flyerName}`);
				}
				// if dodo code
				else {
					msgEmbed(' ', `<@${flyerID}> is flying! The dodo code once again is || ${dodoCode} ||\n Enter \`k!landed\` once you've touched down successfully`);
					console.log(`flying in ${flyerID} ${flyerName}`);
				}

			}
			// if id does not match first in line
			else {
				msgEmbed('Sorry! you are not first in line!');
				printList(1);
			}
		}
		else {
			msgEmbed('Sorry! island is full! Please wait until someone leaves');
			return;
		}
	}

	if (message.content === 'k!landed') {
		// prompt following user to fly
		const curID = message.author.id;
		// flyer id matches first in line
		if (curID === queueList[0]) {
			// save next flier variable
			const nextID = queueList[1];

			// if there no more ids
			if (!nextID) {
				msgEmbed('Queue is now empty!', ' ');
				visitCount = visitCount + 1;
				// move flyerid to active visitors array
				activeVisitors.push(curID);
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
				activeVisitors.push(curID);
				queueList.splice(0, 1);

				// if island is full push the message
				if (visitCount === maxAllow) {
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

	if (message.content === 'k!returned') {
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

	if (message.content === 'k!end') {
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

	if (message.content === 'k!queuehelp') {
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
