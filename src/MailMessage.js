const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs');

/**
 * Email message class for sending TestCafe results via SMTP
 */
class MailMessage {
    /**
     * @param {Object} info - Email content information for template data
     * @param {Object} config - Configuration including SMTP options and template paths
     */
    constructor(info, config) {
        this.info = info;
        this.config = config;
    }

    /**
     * Send the email with test results
     * @returns {Promise<string>} The text body of the email
     */
    async send() {
        try {
            // Compile templates from handlebars source
            const htmlTemplate = fs.readFileSync(this.config.htmlTemplateFile, 'utf-8');
            const htmlTmpl = handlebars.compile(htmlTemplate);
            const textTemplate = fs.readFileSync(this.config.textTemplateFile, 'utf-8');
            const textTmpl = handlebars.compile(textTemplate);

            // Generate email body from template
            const htmlBody = htmlTmpl(this.info);
            const textBody = textTmpl(this.info);

            // Configure email transport
            if (this.config.bDebug) {
                console.log('Transport options:', this.config.smtpOptions);
            }
            
            const transporter = nodemailer.createTransporter(this.config.smtpOptions);

            // Setup email options
            const mailOptions = {
                from: this.info.from,
                to: this.info.recipients,
                subject: this.info.subject,
                text: textBody,
                html: htmlBody
            };

            // Handle test mocking
            if (this.config.smtpOptions.host === 'unit-test-mock') {
                console.log('Unit Test Mock Host defined - do not send emails but consider run successful.');
                console.log('Text email body was:\n********************\n' + textBody + '\n******************');
            } else {
                // Send email
                const info = await transporter.sendMail(mailOptions);
                console.log('Message sent: %s', info.messageId);
            }

            return textBody;
        } catch (error) {
            console.error('Failed to send email:', error);
            throw error;
        }
    }
}

module.exports = MailMessage;
