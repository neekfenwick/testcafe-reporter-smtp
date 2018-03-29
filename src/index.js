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
const envs = require('envs');
const configSource = envs('TESTCAFE_SMTP_CONFIG_FILE');
const dotenvOptions = configSource ? { path: configSource } : null;
require('dotenv').config(dotenvOptions);
import MailMessage from './MailMessage'

export default function () {
    return {

        noColors: true,

        reportTaskStart (startTime, userAgents, testCount) {
			this.reportOnlyFailures = envs('TESTCAFE_SMTP_REPORTONLYFAILURES', 'true');
            this.startTime = startTime;
            this.testCount = testCount;
			this.fixtureInfo = {}; // keyed by fixture name
			this.messages = [];
			this.smtpOptions = {
				host: envs('TESTCAFE_SMTP_SMTPHOST', 'smtp.example.com'),
				port: envs('TESTCAFE_SMTP_SMTPPORT', 587),
				secure: false, // true for 465, false for other ports
				auth: {
					user: envs('TESTCAFE_SMTP_SMTPUSER', 'username'),
					pass: envs('TESTCAFE_SMTP_SMTPPASS', 'password')
				},
				logger: true
			};

            this.messages.push(`Starting testcafe ${startTime}. \n Running tests in: ${userAgents}`);
        },

        reportFixtureStart (name, path) {
            this.currentFixtureName = name;
			this.fixtureInfo[name] = {
				tests: {}
			};
//            this.mail.addLine(this.currentFixtureName);
        },

        reportTestDone (name, testRunInfo) {
			// Pretty format errors to a new property
			if (testRunInfo.errs.length > 0) {
				testRunInfo.formattedErrs = testRunInfo.errs.map((error, id) => {
					return this.formatError(error, `${id + 1} `);
				});
			}
			console.log('Test (' + name + ') results: ', testRunInfo);
			// Record this test's results in the hash for this fixture.
			this.fixtureInfo[this.currentFixtureName].tests[name] = testRunInfo;
//            const hasErr = testRunInfo.errs.length > 0;
//            const result = hasErr ? ':heavy_multiplication_x:' : ':heavy_check_mark: ';
//
//            this.mail.addLine(`${result} ${name}`);
//
//            if (hasErr) {
//                this.renderErrors(testRunInfo.errs);
//            }
        },

        renderErrors(errors) {
            errors.forEach((error, id) => {
                this.slack.addErrorMessage(this.formatError(error, `${id + 1} `));
            })
        },

        reportTaskDone (endTime, passed, warnings) {
			console.log(`endTime ${endTime}, warnings ${warnings}`);
            const durationMs  = endTime - this.startTime;
            const durationStr = this.moment
                .duration(durationMs)
                .format('h[h] mm[m] ss[s]');
			const failedCount = this.testCount - passed;
//            let footer = passed === this.testCount ?
//                `${this.testCount} passed` :
//                `${failedCount}/${this.testCount} failed`;

//            footer = `\n*${footer}* (Duration: ${durationStr})`;

			let subject = failedCount === 0 ?
                `Tests passed OK : ${this.testCount} passed of ${this.testCount}` :
                `TESTS FAILING : ${failedCount} of ${this.testCount} failed`;

			// Pass all our data to the email builder for templating and sending.
			let mail = new MailMessage({
				recipients: envs('TESTCAFE_SMTP_TO_LIST', 'test@example.com, test2@example.com'), // list of receivers
				subject,
				passed,
				failedCount,
				warnings,
				messages: this.messages,
				fixtures: this.fixtureInfo
			}, {
				smtpOptions: this.smtpOptions,
				htmlTemplateFile: envs('TESTCAFE_SMTP_HTML_EMAIL_TEMPLATE', 'defaultHTML.handlebars'),
				textTemplateFile: envs('TESTCAFE_SMTP_TEXT_EMAIL_TEMPLATE', 'defaultTEXT.handlebars')
			});
			mail.send();
        }
    }
}
