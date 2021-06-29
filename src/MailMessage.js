const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs');

function MailMessage (info, config) {
    this.info = info;
    this.config = config;
}

MailMessage.prototype.send = function send () {
    // First compile the template from handlebars source.
    const htmlTemplate = fs.readFileSync(this.config.htmlTemplateFile, 'utf-8');
    const htmlTmpl = handlebars.compile(htmlTemplate);
    const textTemplate = fs.readFileSync(this.config.textTemplateFile, 'utf-8');
    const textTmpl = handlebars.compile(textTemplate);

    // Run our data object through the template to produce the email body.
    const htmlBody = htmlTmpl(this.info);
    const textBody = textTmpl(this.info);
    // console.log('Produced output: ' + htmlBody);

    // Prepare email transport
    if (this.config.bDebug) console.log('Transport options: ', this.config.smtpOptions);
    const transporter = nodemailer.createTransport(this.config.smtpOptions);

    // setup email data with unicode symbols
    const mailOptions = {
        from:    this.info.from, // sender address
        to:      this.info.recipients,
        subject: this.info.subject, // Subject line
        text:    textBody, // plain text body
        html:    htmlBody // html body
    };

    // console.log('mailOptions: ', mailOptions);
    // console.log('smtpOptions: ', this.config.smtpOptions);

    if (this.config.smtpOptions.host === 'unit-test-mock') {
        // Gulpfile.js has indicated we are running a unit test, don't try to actually send an email.
        console.log('Unit Test Mock Host defined - do not send emails but consider run successful.');
        console.log('Text email body was:\n********************\n' + textBody + '\n******************');
    }
    else {
        // send mail with defined transport object
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error);
                return;
            }
            console.log('Message sent: %s', info.messageId);

            // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
            // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
        });
    }

    return textBody;
};

module.exports = MailMessage;

// module.exports = function () {
//     return {
//         /**
//          * info - object containing email contents information, to be passed into the Handlebars template.
//          * config - configuration e.g. smtpOptions.
//          */
//         constructor (info, config) {
//             console.log(`MailMessage ctor here, config ${config}`);
//             this.info = info;
//             this.config = config;
//         },

//         send () {
//             // First compile the template from handlebars source.
//             const htmlTemplate = fs.readFileSync(this.config.htmlTemplateFile, 'utf-8');
//             const htmlTmpl = handlebars.compile(htmlTemplate);
//             const textTemplate = fs.readFileSync(this.config.textTemplateFile, 'utf-8');
//             const textTmpl = handlebars.compile(textTemplate);

//             // Run our data object through the template to produce the email body.
//             const htmlBody = htmlTmpl(this.info);
//             const textBody = textTmpl(this.info);
//             // console.log('Produced output: ' + htmlBody);

//             // Prepare email transport
//             // console.log('Transport options: ', this.config.smtpOptions);
//             const transporter = nodemailer.createTransport(this.config.smtpOptions);

//             // setup email data with unicode symbols
//             // console.log('User info: ', userInfo);
//             const mailOptions = {
//                 from:    this.info.from, // sender address
//                 to:      this.info.recipients,
//                 subject: this.info.subject, // Subject line
//                 text:    textBody, // plain text body
//                 html:    htmlBody // html body
//             };

//             // console.log('mailOptions: ', mailOptions);
//             // console.log('smtpOptions: ', this.config.smtpOptions);

//             if (this.config.smtpOptions.host === 'unit-test-mock') {
//                 // Gulpfile.js has indicated we are running a unit test, don't try to actually send an email.
//                 console.log('Unit Test Mock Host defined - do not send emails but consider run successful.');
//                 console.log('Text email body was:\n********************\n' + textBody + '\n******************');
//             }
//             else {
//                 // send mail with defined transport object
//                 transporter.sendMail(mailOptions, (error, info) => {
//                     if (error) {
//                         console.log(error);
//                         return;
//                     }
//                     console.log('Message sent: %s', info.messageId);

//                     // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
//                     // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
//                 });
//             }
//         }
//     };
// };
