# TestCafe Reporter SMTP 
###testcafe-reporter-smtp

This is a reporter for [TestCafe](http://devexpress.github.io/testcafe). It sends the output of the test as an email via SMTP.

##Purpose
Once configured the reporter builds an email (HTML and text format) and sends via an SMTP service.  This means your test results will be emailed to you in a nicely formatted email.

##Setup instructions

    $ npm install testcafe-reporter-smtp


## Configuration

Configuration is taken from two sources:

- environment variables
- a config file on disk, can be specified via TESTCAFE_SMTP_CONFIG_FILE environment variable

The aim is that you can specify the below configuration parameters either entirely in your local environment variables, or in the config file on disk, or a mixture of both.

- TESTCAFE_SMTP_CONFIG_FILE - config file on disk in the format "VARIABLE=value", defaults to `.env`.
- TESTCAFE_SMTP_SMTPHOST - hostname of your SMTP server
- TESTCAFE_SMTP_SMTPPORT - port to connect to your SMTP server
- TESTCAFE_SMTP_SMTPUSER - username for authentication to your SMTP server
- TESTCAFE_SMTP_SMTPPASS - password for authentication to your SMTP server
- TESTCAFE_SMTP_SECURE   - true | false - passed to the `nodemailer` *secure* option (see [Security and TLS](#security-and-tls) below)
- TESTCAFE_SMTP_FROM     - From address to use when sending email. If not provided, attempts to sniff using `require("os").userInfo()`
- TESTCAFE_SMTP_TO_LIST  - comma separated list of email addresses to send reports to
- TESTCAFE_SMTP_REPORTONLYFAILURES - causes no email to be sent if all tests passed (when you only want to be notified of tests failing)
- TESTCAFE_SMTP_LOGGER   - true | false - passed to the `nodemailer` *logger* option, causes verbose output on the console
- TESTCAFE_SMTP_DEBUG    - anything | undefined - config settings are printed with console.log for debugging - *WARNING:* Will expose passwords and other sensitive information from your config!

### Security and TLS

You probably want the connection to your SMTP server to be encrypted using TLS.  From the `nodemailer` documentation:

    secure – if true the connection will use TLS when connecting to server. If false (the default) then TLS is used if server supports the STARTTLS extension. In most cases set this value to true if you are connecting to port 465. For port 587 or 25 keep it false

So, if you leave out `TESTCAFE_SMTP_SECURE`, the reporter will make a plaintext connection to your server, but if it responds with STARTTLS then the connection will be upgraded to encryption using TLS before authentication is performed.

## Testing

Run the unit tests, which set a dummy SMTP hostname that causes the reporter to not actually send the email it has built.

    $ npm test

The unit test uses Mocha, and does not actually invoke a Testcafe test run or send any emails.

## Usage with TestCafe

You can run TestCafe with testcafe-reporter-smtp either via the command line, or via a test runner.

You must have an SMTP server available to test and a username on it, e.g. gmail.com with your Google credentials.

- cd into your test project.
- Edit or create the `.env` file by adding the following required variables:

    - TESTCAFE_SMTP_SMTPHOST=gmail.com
    - TESTCAFE_SMTP_SMTPUSER=*****
    - TESTCAFE_SMTP_SMTPPASS=*****
    - TESTCAFE_SMTP_TO_LIST=your_user@example.com

Alternatively, call the config file anything you want and set `TESTCAFE_SMTP_CONFIG_FILE=<filename>`.

### Running tests from the commmand line:

```
$ testcafe chrome 'path/to/test/file.js' --reporter smtp
```

**Please Note:** The command line `testcafe` binary executes a forced process stop once the test has finished running, which will probably terminate before the SMTP communication has completed.  You may have better results using the runner API below.

### Running tests from a runner:

When you use TestCafe API, you can pass the reporter name to the `reporter()` method:

```js
const createTestCafe = require('testcafe');
let runner           = null;
let testcafe         = null;

createTestCafe('localhost', 1337, 1338)
    .then(tc => {
		testcafe = tc;
        runner = tc.createRunner();

        return runner
			.src('index.ts') // This is the test fixture to run
			.browsers(['chrome'])
			.reporter('smtp') // This tells it to look for testcafe-reporter-smtp
			.run()
			.then(failedCount => {
				console.log('Runner finished, failedCount: ', failedCount);
				testcafe.close();
			})
			.catch(error => {
				console.error('Caught error: ', error);
			});
});
```

##Further Documentation
[TestCafe Reporter Plugins](https://devexpress.github.io/testcafe/documentation/extending-testcafe/reporter-plugin/)
