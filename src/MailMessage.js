const envs = require('envs');
import nodemailer from 'nodemailer';
import handlebars from 'handlebars';
import fs from 'fs';

export default class MailMessage {
	/**
	 * info - object containing email contents information, to be passed into the Handlebars template.
	 * config - configuration e.g. smtpOptions.
	 */
    constructor(info, config) {
		this.info = info;
		this.config = config;
    }
	
    send() {
		// First compile the template from handlebars source and produce body.
		let htmlTemplate = fs.readFileSync(this.config.htmlTemplateFile, 'utf-8');
		let htmlTmpl = handlebars.compile(htmlTemplate);
		let textTemplate = fs.readFileSync(this.config.textTemplateFile, 'utf-8');
		let textTmpl = handlebars.compile(textTemplate);

		let htmlBody = htmlTmpl(this.info);
		let textBody = textTmpl(this.info);
		console.log('Produced output: ' + htmlBody);
		
		// Prepare email transport
//		console.log('Transport options: ', this.config.smtpOptions);
		let transporter = nodemailer.createTransport(this.config.smtpOptions);

		// setup email data with unicode symbols
		let userInfo = require("os").userInfo();
		console.log('User info: ', userInfo);
		let mailOptions = {
			from: `"${userInfo.username}" <${userInfo.email}>`, // sender address
			to: this.info.recipients,
			subject: this.info.subject, // Subject line
			text: textBody, // plain text body
			html: htmlBody // html body
		};

		// send mail with defined transport object
//		console.log('mailOptions: ', mailOptions);
		transporter.sendMail(mailOptions, (error, info) => {
			if (error) {
				return console.log(error);
			}
			console.log('Message sent: %s', info.messageId);

			// Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
			// Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
		});
    }
}