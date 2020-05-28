process.env.NODE_ENV = 'test';

const bot = require('../../src/js/bot.js');

describe('bot', function() {

	it('is ready', function(done) {
		bot.client.on('ready', done);
	});

	after(function() {
		bot.client.destroy();
		console.log('shut down.');
	});
});