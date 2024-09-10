const pug = require('pug');
const {convert} = require('html-to-text');
const nodemailer = require('nodemailer');

// new Email(user, url).sendWelcome();

module.exports = class Email {
    constructor(user, url, tourID = null) {
        this.to = user.email;
        this.firstName = user.name.split(' ')[0];
        this.url = url;
        this.from = `Mohamad Rammal <${process.env.EMAIL_FROM}>`;

        // Check if tourID exists before accessing its properties
        this.tourName = tourID ? tourID.name : null;
        this.tourPrice = tourID ? tourID.price : null;
        this.tourStartDates = tourID && tourID.startDates ? tourID.startDates[0] : null;
    }

    newTransport() {
        if (process.env.NODE_ENV === 'production') {
            return nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.USER_EMAIL,
                    pass: process.env.USER_PASS,
                },
            });
        }

        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD,
            },
        });
    }

    async send(template, subject) {
        // 1) Render HTML based on a Pug template
        const html = pug.renderFile(`${__dirname}/../views/emails/${template}.pug`, {
            firstName: this.firstName,
            url: this.url,
            tourName: this.tourName,
            tourPrice: this.tourPrice,
            tourStartDates: this.tourStartDates,
            subject,
        });

        // 2) Define email options
        const mailOptions = {
            from: this.from,
            to: this.to,
            subject,
            text: convert(html, {wordwrap: 130}), // Updated htmlToText usage
            html,
        };

        // 3) Create a transport and send email
        await this.newTransport().sendMail(mailOptions);
    }

    async sendWelcome() {
        await this.send('Welcome', 'Welcome to VistaVoy');
    }

    async sendPasswordReset() {
        await this.send('passwordReset', 'Your Password Reset Link - Valid for 10 Minutes!');
    }

    async sendPayment() {
        await this.send('paymentDone', 'Your Payment!');
    }
};
