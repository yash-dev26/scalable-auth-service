import config from "./server.config.js";
import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: config.googleUser,
    clientId: config.googleClientId,
    clientSecret: config.googleClientSecret,
    refreshToken: config.googleRefreshToken,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error('Error setting up Nodemailer transporter:', error);   
    } else {
    console.log('Nodemailer transporter is ready to send emails');
    }
});

