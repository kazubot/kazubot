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
const prefix = 'k!';

let active = false;
let hostID;
let dodoCode;
let maxVisitors;
let maxQueueSize;
let visitCount;

//#endregion

// listening for messages on monitored channels, .on runs multiple times
client.on('message', message => {
	// ignore bot messages
	if (message.author.bot) {
		return;
	}

	// parse message into author, command, and arguments
	const messageAuthor = message.author.id;
	const args = message.content.slice(prefix.length).trim().split(/ +/g);
	const command = args.shift().toLowerCase();

	//#region status and info
	if (command === 'hi') {
		const today = new Date();

		// 24h into 12
		if (today.getHours() > 12) {
			msgEmbed(
				':)',
				`Hi <@${messageAuthor}> I'm online now!\n\n ${today.toDateString()}, ${today.getHours() - 12}:${today.getMinutes()}PM`,
				'https://pbs.twimg.com/media/EW-7berUMAEMNke?format=png',
			);
		}
		// 12h is AM
		else {
			msgEmbed(
				':)',
				`Hi <@${messageAuthor}> I'm online!\n\n ${today.toDateString()}, ${today.getHours()}:${today.getMinutes()}AM`,
				'https://pbs.twimg.com/media/EW-7berUMAEMNke?format=png',
			);
		}
	}

	if (command === 'help' || command === 'info') {
		const helpMessage = new Discord.MessageEmbed()
			.setColor('#FF8362')
			.setTitle('Queue Commands')
			.setDescription('Hi, I\'m Kazuma bot! Ren and Spekkio built me.')
			.addFields(
				{ name:'\u200B', value:'`k!start dodocode`\n to start a queue as an island host\neg: k!start IS4BL' },
				{ name:'\u200B', value:'`k!end`\n to tell the bot you are closing your island. (empties queue)' },
				{ name:'\u200B', value:'`k!join`\n to join the queue' },
				{ name:'\u200B', value:'`k!fly`\n to tell the bot you are present and ready to fly in' },
				{ name:'\u200B', value:'`k!landed`\n to tell the bot you\'ve landed on the island' },
				{ name:'\u200B', value:'`k!returned`\n to tell the bot you\'ve returned home' },
				{ name:'\u200B', value:'`k!leave`\n to leave to queue at any time.' },
				{ name:'\u200B', value:'`k!island`\n to see the open island info again.' },
				{ name:'\u200B', value:'`k!queue`\n to see who is queued to visit an island.' },
				{ name:'\u200B', value:'`k!visitors`\n to see a list of island visitors.' },
				{ name:'\u200B', value:'`k!remove`\n to remove a person from the queue and island (host/admin).' },
			)
			.setFooter('Ren K#6666 & Spekkio#6969');

		message.channel.send(helpMessage);
	}
	//#endregion

	//#region queueing functionality
	if (message.content.startsWith('k!start')) {
		// checks if an island is currently being hosted
		if (active === false) {
			hostID = messageAuthor;
			dodoCode = args[0];
			maxVisitors = !isNaN(args[1]) ? Math.abs(args[1]) : 7; // 7 is max capacity for visitors in AC:NH
			maxQueueSize = !isNaN(args[2]) ? Math.abs(args[2]) : 120; // 120 is a good ceiling for a PM turnip selling queue

			if (!dodoCode || maxVisitors > 7 || maxQueueSize > 120) {
				// queue arguments passed in message are unacceptable
				msgEmbed('You requested a queue with missing or incorrect values, try again!',
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
			message.channel.send('An island is already being hosted',
				'Support for multiple island queues has not yet been added.');
		}
	}

	if (command === 'end') {
		const endID = messageAuthor;
		console.log(`end command ${endID} host was ${hostID}`);

		if (endID === hostID || message.member.hasPermission('ADMINISTRATOR')) {
			// clear queue
			queueList.fill(0);
			msgEmbed('', `Queue has been cleared! Thank you for hosting <@${hostID}>!`);

			// allow new queue requests
			active = false;
			dodoCode = null;
			console.log('queue cleared, room closed');
		}
		else {
			msgEmbed('Sorry you are not the host!');
			console.log('non host tried to close room');
		}
	}

	if (command === 'island') {
		printIsland();
	}

	if (command === 'queue') {
		if (queueList.length === 0) {
			printQueueEmpty();
		}
		else {
			printList(1);
		}
	}

	if (command === 'visitors') {
		if (activeVisitors.length === 0) {
			msgEmbed('', 'There are no visitors on the island.');
		}
		else {
			printList(0);
		}
	}

	if (command === 'join') {
		if (queueList.length + 1 <= maxQueueSize) {
			const joinId = messageAuthor;

			// if join id is not found in qlist
			if (queueList.indexOf(joinId) === -1) {
				queueList.push(joinId);
				msgEmbed('', `<@${joinId}> placed in queue list, you are #${queueList.length}`);

				// if first in line
				if (queueList.length === 1) {
					message.channel.send('type `k!fly` to start');
				}
				console.log(`placed ${joinId} in queue in ${queueList.length}`);
			}
			else {
				msgEmbed('', `<@${joinId}>, you are already in the queue!`);
			}
		}
		else {
			msgEmbed('Sorry, the queue is full', `<@${messageAuthor}>, please try again when a spot opens up!`);
		}
	}

	if (command === 'fly') {
		const flyerID = messageAuthor;

		if (activeVisitors.length <= maxVisitors) {
			// if first in queue list
			if (flyerID === queueList[0]) {
				printClearForTakeoff(flyerID);
				console.log(`flying in ${flyerID}`);
			}
			else {
				msgEmbed('', `Sorry <@${flyerID}>, you are not first in line!`);
				printList(1);
			}
		}
		else {
			msgEmbed('', `Sorry <@${messageAuthor}>, The island is full! Please wait until someone leaves and try again.`);
		}
	}

	if (command === 'landed') {
		const currentId = messageAuthor;

		// if author is first in queue
		if (currentId === queueList[0]) {
			// move author to visitors list and remove from queue list
			activeVisitors.push(currentId);
			queueList.splice(0, 1);
			visitCount = visitCount + 1;
			console.log(`visit count:${visitCount}`);

			const nextID = queueList[1]; // grab next person in queue list (if any)

			if (!nextID) {
				printQueueEmpty();
			}
			else if (visitCount === maxVisitors) {
				msgEmbed('Island is now full, the next flier will be prompted once someone leaves.',
					'\nVisitors please remember to enter `k!returned` once you\'ve left');
			}
			else {
				printClearForTakeoff(nextID);
			}
		}
		else {
			msgEmbed('', `Sorry <@${currentId}>, you are not currently flying!`);
		}
	}

	if (command === 'returned') {
		const returnId = messageAuthor;
		const returnIdIndex = activeVisitors.indexOf(returnId);

		if (returnIdIndex === -1) {
			msgEmbed('', `Sorry <@${returnIdIndex[0]}>, you are not on the island`);
		}
		else {
			// remove id from visitors list
			activeVisitors.splice(returnIdIndex, 1);
			msgEmbed('', `<@${returnId}> has returned home`);
			visitCount = visitCount - 1;

			// prompt next flier if anyone is on the list
			if (queueList.length > 0) {
				printClearForTakeoff(queueList[0]);
			}
			else {
				printQueueEmpty();
			}
		}
	}

	if (command === 'leave') {
		const leaveId = messageAuthor;
		removeUser(leaveId);
	}

	if (command === 'remove') {
		if (hostID === messageAuthor || message.member.hasPermission('ADMINISTRATOR')) {
			let kickId = message.mentions.users.first().toString();
			kickId = kickId.replace(/\D/g, ''); // use regex to strip out non-digit characters

			if (kickId !== null && kickId !== '') {
				removeUser(kickId);
				kickId = null;
			}
			else {
				msgEmbed('Please @mention a user to remove (host/admin capability)');
			}
		}
		else {
			msgEmbed('Only the queue host or server admins can remove members.');
		}
	}
	//#endregion

	//#region repeated functions
	function msgEmbed(title, desc, thumbnail) {
		const Message = new Discord.MessageEmbed()
			.setColor('#FF8362')
			.setTitle(title)
			.setDescription(desc)
			.setThumbnail(thumbnail);
		message.channel.send(Message);
	}

	function printList(listType = 0) {
		// prints queue if list type is 0, else prints visitor list if 1
		const userID = listType ? queueList.values() : activeVisitors.values();
		let listMessage = listType ? 'Queue order is:' : 'Visitor(s) on island:';
		let mention;
		let i = 1;

		for (const display of userID) {
			mention = `<@${display}>`;
			listMessage = listMessage + '\n' + i + ': ' + mention;
			i++;
		}
		msgEmbed('', listMessage);
	}

	function printIsland() {
		if (active === true) {
			msgEmbed('Island opened with queue!',
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

	function printClearForTakeoff(clearedId) {
		if (clearedId !== null && clearedId !== '') {
			msgEmbed('', `<@${clearedId}> is flying! The dodo code once again is || ${dodoCode} ||
			\nRemember to enter \`k!landed\` once you've touched down successfully!`);
			console.log(`prompting next flier ${clearedId}`);
		}
	}

	function removeUser(removeId) {
		let didRemove = false;
		let removeMessage = `Removed <@${removeId}> from `;
		console.log(`user to remove: ${removeId}`);
		console.log(`queue list: ${queueList.toString()}`);
		console.log(`visitor list: ${activeVisitors.toString()}`);
		console.log(`index lookup for queue check: ${queueList.indexOf(removeId)}`);
		console.log(`index lookup for visitor check: ${activeVisitors.indexOf(removeId)}`);

		if (queueList.indexOf(removeId > -1)) {
			queueList.splice(removeId, 1);
			didRemove = true;
			removeMessage = removeMessage + 'the queue';
		}

		if (activeVisitors.indexOf(removeId) > -1) {
			activeVisitors.splice(removeId, 1);
			if (didRemove) {
				removeMessage = removeMessage + 'and the island';
			}
			else {
				removeMessage = removeMessage + 'the island';
				didRemove = true;
			}
		}

		if (didRemove) {
			msgEmbed('', removeMessage);
			didRemove = false;
		}
	}

	function printQueueEmpty() {
		msgEmbed('The queue is now empty!', 'Use `k!end` to close the queue if desired.');
	}
	//#endregion
});
