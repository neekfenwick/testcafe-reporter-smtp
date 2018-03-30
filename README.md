# TestCafe Reporter SMTP 
###testcafe-reporter-smtp

This is a reporter for [TestCafe](http://devexpress.github.io/testcafe). It sends the output of the test as an email via SMTP.

##Purpose
Once configured the reporter builds an email (HTML and text format) and sends via an SMTP service.

##Setup instructions
Follow the instructions bellow to configure this plugin. 
	
First install this package globally to the machine you would like to run your tests on and then:

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
- TESTCAFE_SMTP_TO_LIST  - comma separated list of email addresses to send reports to
- TESTCAFE_SMTP_REPORTONLYFAILURES - causes no email to be sent if all tests passed (when you only want to be notified of tests failing)

### Security and TLS

You probably want the connection to your SMTP server to be encrypted using TLS.  From the `nodemailer` documentation:

    secure – if true the connection will use TLS when connecting to server. If false (the default) then TLS is used if server supports the STARTTLS extension. In most cases set this value to true if you are connecting to port 465. For port 587 or 25 keep it false

So, if you leave out `TESTCAFE_SMTP_SECURE`, the reporter will make a plaintext connection to your server, but if it response with STARTTLS then the connection will be upgraded to encryption using TLS before authentication is performed.

## Testing
Running TestCafe with testcafe-reporter-smtp.

You must have an SMTP server available to test and a username on it, e.g. gmail.com with your Google credentials.

- cd into your test project.
- Edit or create the `.env` file by adding the following required variables:

    - TESTCAFE_SMTP_SMTPHOST=gmail.com
    - TESTCAFE_SMTP_SMTPUSER=*****
    - TESTCAFE_SMTP_SMTPPASS=*****
    - TESTCAFE_SMTP_TO_LIST=your_user@example.com

Alternatively, call the config file anything you want and set `TESTCAFE_SMTP_CONFIG_FILE=<filename>`.

- Now run your tests from the commmand line:

```
$ testcafe chrome 'path/to/test/file.js' --reporter smtp
```

When you use TestCafe API, you can pass the reporter name to the `reporter()` method:

```js
testCafe
    .createRunner()
    .src('path/to/test/file.js')
    .browsers('chrome')
    .reporter('smtp') // <-
    .run();
```

##Further Documentation
[TestCafe Reporter Plugins](https://devexpress.github.io/testcafe/documentation/extending-testcafe/reporter-plugin/)
