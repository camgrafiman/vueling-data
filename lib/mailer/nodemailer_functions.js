const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "hotmail",
    auth: {
        user: process.env.OUTLOOK_USER,
        pass: process.env.OUTLOOK_PASS
    }
});



module.exports = { transporter }