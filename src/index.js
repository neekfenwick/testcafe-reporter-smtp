/**
 * Read config from .env file or the file specified by TESTCAFE_SMTP_CONFIG_FILE.
 * Example config file:
 *   TESTCAFE_SMTP_SMTPHOST=example.com
 *   TESTCAFE_SMTP_SMTPUSER=mickey
 *   TESTCAFE_SMTP_SMTPPASS=mouse
 *   TESTCAFE_SMTP_SMTPPORT=25
 *   TESTCAFE_SMTP_TO_LIST=me@example.com,mum@example.com
 * Email construction and sending is performed in MailMessage, and is separated
 * from the config mechanism (all values are passed in as objects).
 * @type Module envs|Module envs
 */
const configSource = process.env.TESTCAFE_SMTP_CONFIG_FILE;
const dotenvOptions = configSource ? { path: configSource } : null;
require('dotenv').config(dotenvOptions);
const path = require('path');
import MailMessage from './MailMessage'

function getEnv (key, _default) {
		return process.env.hasOwnProperty(key) ? process.env[key] : _default;
}

export default function () {
	return {

		noColors: true,

		reportTaskStart (startTime, userAgents, testCount) {
			this.reportOnlyFailures = getEnv('TESTCAFE_SMTP_REPORTONLYFAILURES', 'true');
			this.startTime = startTime;
			this.testCount = testCount;
			this.fixtureInfo = {}; // keyed by fixture name, data for email template
			this.messages = [];
			this.smtpOptions = {
				host: getEnv('TESTCAFE_SMTP_SMTPHOST', 'smtp.example.com'),
				port: getEnv('TESTCAFE_SMTP_SMTPPORT', 587),
				auth: {
					user: getEnv('TESTCAFE_SMTP_SMTPUSER', 'username'),
					pass: getEnv('TESTCAFE_SMTP_SMTPPASS', 'password')
				},
				logger: getEnv('TESTCAFE_SMTP_LOGGER', 'false') === 'true'
			};
			// Include secure if it is defined, else let it default.
			var secure = getEnv('TESTCAFE_SMTP_SECURE', '');
			if (secure) {
				this.smtpOptions.secure = secure;
			}

			this.messages.push(`Starting testcafe ${startTime}. \n Running tests in: ${userAgents}`);
		},

		reportFixtureStart (name, path) {
			this.currentFixtureName = name;
			this.fixtureInfo[name] = {
				tests: {}
			};
		},

		reportTestDone (name, testRunInfo) {
			// Pretty format errors to a new property
			if (testRunInfo.errs.length > 0) {
				testRunInfo.formattedErrs = testRunInfo.errs.map((error, id) => {
					return this.formatError(error, `${id + 1} `);
				});
			}
//			console.log('Test (' + name + ') results: ', testRunInfo);
			// Record this test's results in the hash for this fixture.
			this.fixtureInfo[this.currentFixtureName].tests[name] = testRunInfo;
		},

		reportTaskDone (endTime, passed, warnings) {
			// console.log(`endTime ${endTime}, warnings ${warnings}`);
			const durationMs  = endTime - this.startTime;
			const durationStr = this.moment
				.duration(durationMs)
				.format('h[h] mm[m] ss[s]');
			const failedCount = this.testCount - passed;
//			let footer = passed === this.testCount ?
//				`${this.testCount} passed` :
//				`${failedCount}/${this.testCount} failed`;

//			footer = `\n*${footer}* (Duration: ${durationStr})`;

			let subject = failedCount === 0 ?
				`Tests passed OK : ${this.testCount} passed of ${this.testCount}` :
				`TESTS FAILING : ${failedCount} of ${this.testCount} failed`;

			if (failedCount === 0 && getEnv('TESTCAFE_SMTP_REPORTONLYFAILURES', '') === 'true') {
				// console.log('reporter-smtp: No failures, not sending email.');
				return;
			}

			let from = getEnv('TESTCAFE_SMTP_FROM', null);
			if (!from) {
				let userInfo = require("os").userInfo();
				from = `"${userInfo.username}" <${userInfo.email}>`;
			}

			// Pass all our data to the email builder for templating and sending.
			let mail = new MailMessage({
				from: from,
				recipients: getEnv('TESTCAFE_SMTP_TO_LIST', 'test@example.com, test2@example.com'), // list of receivers
				subject,
				passed,
				failedCount,
				warnings,
				messages: this.messages,
				fixtures: this.fixtureInfo
			}, {
				smtpOptions: this.smtpOptions,
				htmlTemplateFile: getEnv('TESTCAFE_SMTP_HTML_EMAIL_TEMPLATE', path.join(__dirname, 'templates/defaultHTML.handlebars')),
				textTemplateFile: getEnv('TESTCAFE_SMTP_TEXT_EMAIL_TEMPLATE', path.join(__dirname, 'templates/defaultTEXT.handlebars'))
			});
			mail.send();
		}
	};
}
