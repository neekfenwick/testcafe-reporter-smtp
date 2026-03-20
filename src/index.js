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
 */
const MailMessage = require('./MailMessage');
const dotenv = require('dotenv');
const { join } = require('path');

const configSource = process.env.TESTCAFE_SMTP_CONFIG_FILE;
const bDebug = process.env.TESTCAFE_SMTP_DEBUG;
const dotenvOptions = configSource ? { path: configSource } : null;

dotenv.config(dotenvOptions);

/**
 * Get environment variable with fallback default
 * @param {string} key - Environment variable name
 * @param {string} _default - Default value if not set
 * @returns {string} Environment variable value or default
 */
function getEnv(key, _default) {
    return Object.prototype.hasOwnProperty.call(process.env, key) ? process.env[key] : _default;
}

/**
 * Validate required SMTP configuration
 * @param {Object} smtpOptions - SMTP configuration object
 * @throws {Error} If required configuration is missing
 */
function validateSmtpConfig(smtpOptions) {
    if (!smtpOptions.host || smtpOptions.host === 'smtp.example.com') {
        throw new Error('TESTCAFE_SMTP_SMTPHOST must be configured with a valid SMTP host');
    }
    if (!smtpOptions.auth?.user || smtpOptions.auth.user === 'username') {
        throw new Error('TESTCAFE_SMTP_SMTPUSER must be configured with a valid username');
    }
    if (!smtpOptions.auth?.pass || smtpOptions.auth.pass === 'password') {
        throw new Error('TESTCAFE_SMTP_SMTPPASS must be configured with a valid password');
    }
}

module.exports = function () {
    return {
        noColors: true,

        reportTaskStart (startTime, userAgents, testCount) {
            // Include secure if it is defined, else let it default.
            if (bDebug) console.log(`Loading config from ${configSource}... dotenv options ${JSON.stringify(dotenvOptions)}`);
            
            const secure = getEnv('TESTCAFE_SMTP_SECURE', '');

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
            
            if (secure) {
                this.smtpOptions.secure = secure;
            }
            
            // Only validate config in non-test environments
            if (this.smtpOptions.host !== 'unit-test-mock') {
                try {
                    validateSmtpConfig(this.smtpOptions);
                } catch (error) {
                    console.error('SMTP Configuration Error:', error.message);
                    console.error('Please check your environment variables or config file.');
                    throw error;
                }
            }
            
            if (bDebug) console.log(`Built smtpOptions: ${JSON.stringify(this.smtpOptions)}`);

            this.messages.push(`Starting testcafe ${startTime}.\n Running tests in: ${userAgents}`);
        },

        reportFixtureStart (name/*, path*/) {
            this.currentFixtureName = name;
            this.fixtureInfo[name] = {
                tests: {}
            };
        },

        reportTestStart (/* name, testMeta */) {
            // NOTE: This method is optional.
        },

        reportTestDone (name, testRunInfo) {
            // Pretty format errors to a new property
            if (testRunInfo.errs.length > 0) {
                testRunInfo.formattedErrs = testRunInfo.errs.map((error, id) => {
                    return this.formatError(error, `${id + 1} `);
                });
            }
            // console.log('Test (' + name + ') results: ', testRunInfo);
            // Record this test's results in the hash for this fixture.
            this.fixtureInfo[this.currentFixtureName].tests[name] = testRunInfo;
        },

        reportTaskDone (endTime, passed, warnings) {
            // console.log(`endTime ${endTime}, warnings ${warnings}`);
            // const durationMs  = endTime - this.startTime;
            const failedCount = this.testCount - passed;

            let from = getEnv('TESTCAFE_SMTP_FROM', null);

            const subject = failedCount === 0 ?
                `Tests passed OK : ${this.testCount} passed of ${this.testCount}` :
                `TESTS FAILING : ${failedCount} of ${this.testCount} failed`;

            if (failedCount === 0 && getEnv('TESTCAFE_SMTP_REPORTONLYFAILURES', '') === 'true') {
                console.log('reporter-smtp: No failures, not sending email.');
                return;
            }

            if (!from) {
                const userInfo = require('os').userInfo();
                from = `"${userInfo.username}" <${userInfo.email}>`;
            }

            // Pass all our data to the email builder for templating and sending.
            const mail = new MailMessage({
                from:       from,
                recipients: getEnv('TESTCAFE_SMTP_TO_LIST', 'test@example.com, test2@example.com'), // list of receivers
                subject,
                passed,
                failedCount,
                warnings,
                messages:   this.messages,
                fixtures:   this.fixtureInfo
            }, {
                bDebug:           bDebug,
                smtpOptions:      this.smtpOptions,
                htmlTemplateFile: getEnv('TESTCAFE_SMTP_HTML_EMAIL_TEMPLATE', join(__dirname, 'templates/defaultHTML.handlebars')),
                textTemplateFile: getEnv('TESTCAFE_SMTP_TEXT_EMAIL_TEMPLATE', join(__dirname, 'templates/defaultTEXT.handlebars'))
            });

            // Handle async email sending
            mail.send()
                .then((textBody) => {
                    this.write(textBody);
                })
                .catch((error) => {
                    console.error('Failed to send email report:', error.message);
                    this.write('Error sending email report. Check console for details.');
                });
        }
    };
};
