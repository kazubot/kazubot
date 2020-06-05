/* eslint-disable no-unused-vars */
/* eslint-disable no-empty-function */
process.env.NODE_ENV = 'test';

const rewire = require('rewire');
const bot = rewire('../src/js/bot.js');
const expect = require('chai').expect;

describe('bot', function() {

	// Private getters/setters for unit testing
	const buffer = bot.__get__('buffer');
	const setBuffer = bot.__get__('setBuffer');
	const postToChannel = bot.__set__('postToChannel', function skipPostToChannel() {}); // ignore method for tests

	// Boot bot for functional tests
	it('is ready', function(done) {
		bot.client.on('ready', done);
	});

	// Unit test
	context('when setting buffer time to an invalid value', function() {
		it('should throw error', function() {
			expect(function() {
				setBuffer(90);
			}).to.throw(Error, 'setBuffer() expects an integer between 0 and 60 inclusive');
		});
	});

	context('when setting buffer time to 0', function() {
		it('should succeed', function() {
			setBuffer(0);
			expect(buffer === 0);
		});
	});

	context('when setting buffer time to 60', function() {
		it('should succeed', function() {
			setBuffer(60);
			expect(buffer === 60000); // *1000 because milliseconds
		});
	});

	context('when setting buffer time to -5', function() {
		it('should succeed', function() {
			setBuffer(-5);
			expect(buffer === 5000); // *1000 because milliseconds
		});
	});

	// Destroy bot when testing is done
	after(function() {
		bot.client.destroy();
		console.log('shut down.');
	});
});
