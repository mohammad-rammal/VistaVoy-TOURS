const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        const mailOptions = {
            from: 'Mohamad Rammal <mohammad.rammal@hotmail.com>',
            to: options.email,
            subject: options.subject,
            text: options.message,
            html: '<h1>Email </h1>',
        };

        await transporter.sendMail(mailOptions);
    } catch (err) {
        console.error('Error sending email:', err);
        throw new Error('Email could not be sent.');
    }
};

module.exports = sendEmail;
