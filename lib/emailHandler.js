const nodemailer = require('nodemailer');

const { NODE_ENV, EMAIL_SERVICE, EMAIL_HOST, EMAIL_FROM, GMAIL_USER, GMAIL_PASS, EMAIL_USERNAME, EMAIL_PASSWORD, APP_URL } = require('../config/environments');

/**
 * Send Email
 * @param {String[]} recipients Array of email strings, ex: ['john@edu.com', 'michael@gmail.com']
 * @param {String} subject Subject to appear in email as title of the message
 * @param {String} html Body of the message (text with HTML tags)
 * @param {Object[]} [attachments] Optional attachments to be sent with email
 * @returns {Promise} Returns promise that resolves if email is sent successfully, otherwise rejects with error
 */
const sendEmail = (recipients, subject, html, attachments) => {
  if (NODE_ENV === 'test') {
    return Promise.resolve();
  }

  let transported;

  if (EMAIL_SERVICE === 'gmail') {
    transported = nodemailer.createTransport({
      service: EMAIL_SERVICE,
      host: EMAIL_HOST,
      port: 25,
      secure: false,
      auth: {
        user: GMAIL_USER,
        pass: GMAIL_PASS,
      },
    });
  } else {
    transported = nodemailer.createTransport({
      host: EMAIL_HOST,
      port: 25,
      secure: false,
      auth: {
        user: EMAIL_USERNAME,
        pass: EMAIL_PASSWORD,
      },
    });
  }

  const options = {
    from: `Project name <${EMAIL_FROM}>`,
    to: recipients,
    subject,
    html,
  };

  if (attachments) options.attachments = attachments;

  return transported.sendMail(options);
};

const emailTemplates = {
  forgotPassword: (userName, resetToken) => `
    <p>Poštovani/a ${userName},</p>
    <br>
    <p>Primili smo zahtev za promenu lozinke za Vaš nalog na <strong>Project name</strong> aplikaciji.</p>
    <p>Da biste uspešno kompletirali proces promene lozinke, kliknite na sledeći link:  <a href='${APP_URL}/lozinka/reset?resetToken=${resetToken}'>${APP_URL}/lozinka/reset?resetToken=${resetToken}</a></p>
    <br>
    <p>Hvala Vam na korišćenju naše aplikacije.</p>
    <br>
    <p>S poštovanjem,</p>
    <p>Projektni time</p>
  `,
};

module.exports = {
  sendEmail,
  emailTemplates,
};
