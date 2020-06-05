// kazubot is a discord bot for handling queuing and other acnh related tasks

//#region initialization
console.log('Starting kazubot...');
const Discord = require('discord.js');
const client = new Discord.Client();
exports.client = client;
const prefix = 'k!';

// grab token from docker secrets
const token = process.env.TOKEN;

// setting up queue variables
const queueList = new Array();
const activeVisitors = new Array();
let buffer = 15000;
exports.buffer = buffer;
console.log('Queue buffer set to:  ' + (buffer / 1000) + ' seconds.');

// running discord client with token
client.once('ready', () => {
	console.log('Ready!');
});

client.login(token);

let latestMessage;

let active = false;
let hostID;
let dodoCode;
let maxVisitors;
let maxQueueSize;
//#endregion

// listening for messages on monitored channels, triggers functions based on k!command
client.on('message', message => {
	// ignore bot messages
	if (message.author.bot) {
		return;
	}

	// parse message into author, command, and arguments and make available to functions
	latestMessage = message;
	const messageAuthor = message.author.id;
	const args = message.content.slice(prefix.length).trim().split(/ +/g);
	const command = args.shift().toLowerCase();

	//#region status and info
	if (command === 'hi') {
		const today = new Date();

		// 24h into 12
		if (today.getHours() > 12) {
			postToChannel(
				':)',
				`Hi <@${messageAuthor}> I'm online now!\n\n ${today.toDateString()}, ${today.getHours() - 12}:${today.getMinutes()}PM`,
				'https://pbs.twimg.com/media/EW-7berUMAEMNke?format=png',
			);
		}
		// 12h is AM
		else {
			postToChannel(
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
				{ name:'\u200B', value:'`k!start dodocode [concurrentVisitorLimit] [queueSizeLimit]`\nto start a queue as an island host\neg: k!start IS4BL 4 20' },
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
				{ name:'\u200B', value:'`k!buffer timeInSeconds`\n to adjust flight clearence buffer from 0 - 60 seconds inclusive (admin-only).' },
			)
			.setFooter('Ren K#6666 & Spekkio#6969');

		message.channel.send(helpMessage);
	}
	//#endregion

	//#region queueing functionality
	if (command === 'start') {
		// checks if an island is currently being hosted
		if (active === false) {
			hostID = messageAuthor;
			dodoCode = args[0];
			maxVisitors = !isNaN(args[1]) ? Math.abs(args[1]) : 7; // 7 is max capacity for visitors in AC:NH
			maxQueueSize = !isNaN(args[2]) ? Math.abs(args[2]) : 120; // 120 is a good ceiling for a PM turnip selling queue

			if (!dodoCode || maxVisitors > 7 || maxVisitors <= 0 || maxQueueSize > 120 || maxQueueSize <= 0) {
				// queue arguments passed in message are unacceptable
				postToChannel('You requested a queue with missing or incorrect values, try again!',
					`Format: \`k!start dodoCode [concurrentVisitorLimit] [queueSizeLimit]\`
					\n Values: Concurrent Visitor Maximum = 7 | Queue Size Maximum = 120`);
			}
			else {
				// valid arguments passed for queue
				active = true;
				printIsland();
				message.channel.send('When ready, join the queue with: `k!join`');
				console.log(`[START]: Island opening with maxVisitors: ${maxVisitors}
				\n and queue opened with maxQueueSize: ${maxQueueSize}`);
			}
		}
		else {
			message.channel.send('An island is already being hosted',
				'Support for multiple island queues has not yet been added.');
		}
	}

	if (command === 'end') {
		const endID = messageAuthor;

		if (endID === hostID || message.member.hasPermission('ADMINISTRATOR')) {
			// clear queue
			queueList.splice(0, queueList.length);
			activeVisitors.splice(0, activeVisitors.length);
			console.log(`[END]: Clearing lists, queueList = ${queueList.length}, activeVisitors = ${activeVisitors.length}`);
			postToChannel('', `Queue and visitor list has been cleared! Thank you for hosting <@${hostID}>!`);

			// allow new queue requests
			active = false;
			dodoCode = null;
			console.log('[END]: queue cleared, island closed');
		}
		else {
			postToChannel('Sorry you are not the host!');
			console.log('[END]: non host tried to close island');
		}
	}

	if (command === 'island') {
		printIsland();
	}

	if (command === 'queue' || command === 'viewlist') {
		if (queueList.length === 0) {
			printQueueEmpty();
		}
		else {
			printList(1);
		}
	}

	if (command === 'visitors') {
		if (activeVisitors.length === 0) {
			postToChannel('', 'There are no visitors on the island.');
		}
		else {
			printList(0);
		}
	}

	if (command === 'join') {
		console.log(`[JOIN STARTED]: queue length = ${queueList.length} max size = ${maxQueueSize}
		activeVisitors = ${activeVisitors.length} max visitors = ${maxVisitors}`);
		const joinId = messageAuthor;

		// if join id is not found in qlist
		if (queueList.indexOf(joinId) === -1) {
			// if queue list plus joiner hits maximum
			if (queueList.length < maxQueueSize) {
				// add joiner to queue
				queueList.push(joinId);
				console.log(`[JOIN] placed ${joinId} in queue in ${queueList.length}`);

				// if first in line
				if (queueList.length === 1) {
					// if island at capacity
					if (activeVisitors.length === maxVisitors) {
						printIslandFull(joinId);
					}
					else {
						printClearForTakeoff(joinId);
					}
				}
				else {
					postToChannel('', `<@${joinId}> placed in queue list, you are #${queueList.length}`);
					console.log(`${joinId}> placed in queue list at position ${queueList.length}`);
				}
			}
			else {
				postToChannel('Sorry, the queue is full', `<@${messageAuthor}>, please try again when a spot opens up!`);
			}
		}
		else {
			postToChannel('', `<@${joinId}>, you are already in the queue!`);
		}

		console.log(`[JOIN FINISHED]: queue length = ${queueList.length} max size = ${maxQueueSize}
		activeVisitors = ${activeVisitors.length} max visitors = ${maxVisitors}\n`);
	}

	if (command === 'fly') {
		console.log(`[FLY STARTED]: queue length = ${queueList.length} max size = ${maxQueueSize}
		activeVisitors = ${activeVisitors.length} max visitors = ${maxVisitors}`);
		const flyerID = messageAuthor;

		if (queueList.indexOf(messageAuthor) >= 0) {
			if (activeVisitors.length < maxVisitors) {
				// if first in queue list
				if (flyerID === queueList[0]) {
					postToChannel('', `Have a safe flight <@${flyerID}>! Remember to use \`k!landed\` when you arrive.`);
					console.log(`[FLY]: flying in ${flyerID}`);
				}
				else {
					postToChannel('', `Sorry <@${flyerID}>, you are not first in line!`);
					printList(1);
				}
			}
			else {
				postToChannel('', `Sorry <@${messageAuthor}>, The island is full! Please wait until someone leaves and try again.`);
			}
		}
		else {
			postToChannel('', `Sorry <@${messageAuthor}>, you are not in the queue. Use \`k!join\` to join!`);
		}
		console.log(`[FLY FINISHED]: queue length = ${queueList.length} max size = ${maxQueueSize}
		activeVisitors = ${activeVisitors.length} max visitors = ${maxVisitors}\n`);
	}

	if (command === 'landed' || command === 'land') {
		console.log(`[LANDED STARTED]: queue length = ${queueList.length} max size = ${maxQueueSize}
		activeVisitors = ${activeVisitors.length} max visitors = ${maxVisitors}`);
		const currentId = messageAuthor;

		// if author is first in queue
		if (currentId === queueList[0]) {
			// move author to visitors list and remove from queue list
			activeVisitors.push(currentId);
			queueList.splice(0, 1);

			const nextID = queueList[0]; // grab next person in queue list (if any)
			if (!nextID) {
				postToChannel('', `Enjoy your stay on the island <@${messageAuthor}>, and don't forget to use \`k!returned\` when you've gone home!`);
				console.log(`[LANDED] ${messageAuthor} landed on island`);
			}
			else if (activeVisitors.length >= maxVisitors) {
				printIslandFull(nextID);
			}
			else {
				postToChannel('', `<@${nextID}>, get ready! You'll be cleared to fly in ` (buffer / 1000) ` seconds to avoid airport congestion.`);
				setTimeout(() => {printClearForTakeoff(nextID); }, buffer);
			}
		}
		else {
			postToChannel('', `Sorry <@${currentId}>, you are not currently flying!`);
		}
		console.log(`[LANDED FINISHED]: queue length = ${queueList.length} max size = ${maxQueueSize} activeVisitors = ${activeVisitors.length} max visitors = ${maxVisitors}\n`);
	}

	if (command === 'returned' || command === 'return') {
		console.log(`[RETURNED STARTED]: queue length = ${queueList.length} max size = ${maxQueueSize}
		activeVisitors = ${activeVisitors.length} max visitors = ${maxVisitors}`);
		const returnId = messageAuthor;
		const returnIdIndex = activeVisitors.indexOf(returnId);

		if (returnIdIndex === -1) {
			postToChannel('', `Sorry <@${returnId}>, you are not on the island`);
		}
		else {
			// remove id from visitors list
			activeVisitors.splice(returnIdIndex, 1);
			postToChannel('', `<@${returnId}> has returned home`);
			console.log(`[RETURNED]: ${returnId} has been removed from the active visitors list`);

			// prompt next flier if anyone is on the list
			if (queueList.length > 0) {
				printClearForTakeoff(queueList[0]);
			}
			else {
				printQueueEmpty();
			}
		}
		console.log(`[RETURNED FINISHED]: queue length = ${queueList.length} max size = ${maxQueueSize}
		activeVisitors = ${activeVisitors.length} max visitors = ${maxVisitors}\n`);
	}

	if (command === 'leave' || command === 'exit' || command === 'quit') {
		const leaveId = messageAuthor;
		removeUser(leaveId);
	}

	if (command === 'remove' || command === 'kick') {
		if (hostID === messageAuthor || message.member.hasPermission('ADMINISTRATOR')) {
			let kickId = message.mentions.users.first().toString();
			kickId = kickId.replace(/\D/g, ''); // use regex to strip out non-digit characters

			if (kickId !== null && kickId !== '') {
				removeUser(kickId);
				kickId = null;
			}
			else {
				postToChannel('Please @mention a user to remove (host/admin capability)');
			}
		}
		else {
			postToChannel('Only the queue host or server admins can remove members.');
		}
	}

	if (command === 'buffer' && message.member.hasPermission('ADMINISTRATOR')) {
		setBuffer(args[0]);
	}
	//#endregion
});

//#region functions
function postToChannel(title, desc, thumbnail) {
	const Message = new Discord.MessageEmbed()
		.setColor('#FF8362')
		.setTitle(title)
		.setDescription(desc)
		.setThumbnail(thumbnail);
	latestMessage.channel.send(Message);
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
	postToChannel('', listMessage);
}

function printIsland() {
	if (active === true) {
		postToChannel('Island opened with queue!',
			`**Dodo code: ${dodoCode}**
				\nHost: <@${hostID}>
				\nCurrent visitors: ${activeVisitors.length}
				\nMax concurrent visitors: ${maxVisitors}
				\nMax queue size: ${maxQueueSize}`);
	}
	else {
		postToChannel('There is no island queue open right now.');
	}
}

function printClearForTakeoff(clearedId) {
	if (clearedId !== null && clearedId !== '') {
		postToChannel('', `<@${clearedId}> is cleared for takeoff! Use \`k!fly\` when you begin flying. Here's the dodo code again: || ${dodoCode} ||
			\nRemember to enter \`k!landed\` once you've touched down.`);
	}
}

function removeUser(removeId) {
	let didRemove = false;
	let removeMessage = `Removed <@${removeId}> from `;
	const queueIndex = queueList.indexOf(removeId);
	const visitorIndex = activeVisitors.indexOf(removeId);

	console.log(`REMOVE FUNCTION: queueIndex = ${queueIndex} visitorIndex= ${visitorIndex}`);

	if (queueIndex >= 0) {
		queueList.splice(queueIndex, 1);
		console.log(`REMOVE FUNCTION: ${removeId} removed from queue`);
		didRemove = true;
		removeMessage = removeMessage + 'the queue';
	}

	if (visitorIndex >= 0) {
		activeVisitors.splice(visitorIndex, 1);
		console.log(`REMOVE FUNCTION: ${removeId} removed from island`);
		if (didRemove) {
			removeMessage = removeMessage + 'and the island';
		}
		else {
			removeMessage = removeMessage + 'the island';
			didRemove = true;
		}
	}

	if (didRemove) {
		postToChannel('', removeMessage);
		didRemove = false;
	}
	else {
		postToChannel('', 'Sorry, you are not in a queue or on an island.');
		console.log(`REMOVE FUNCTION: ${removeId} not in queue or island`);
	}
}

function printQueueEmpty() {
	postToChannel('The queue is now empty!', 'Use `k!end` to close the queue if desired.');
}

function printIslandFull(nextFlyer) {
	postToChannel('The island is at capacity!',
		`<@${nextFlyer}> is on deck to fly next and will be notified when there is room.
			\nVisitors please remember to enter \`k!returned\` once you've left the island.`);
}

function setBuffer(timeInSeconds) {
	timeInSeconds = Math.abs(timeInSeconds);
	if (Number.isInteger(timeInSeconds) && timeInSeconds <= 60) {
		buffer = timeInSeconds * 1000;
		console.log('buffer set to: ' + buffer);
		postToChannel('', 'Setting flight buffer time to: ' + (buffer / 1000) + ' seconds.');
	}
	else {
		// queue arguments passed in message are unacceptable
		postToChannel('You requested a buffer time with missing or incorrect values, try again!',
			'Format: `k!buffer timeInSeconds (60 second maximum)',
		);

		throw new Error('setBuffer() expects an integer between 0 and 60 inclusive');
	}
}

exports.setBuffer = setBuffer;
//#endregion
