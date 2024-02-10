const bunyan = require('bunyan');

// eslint-disable-next-line no-useless-escape
const emailRegExp = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

/**
 * Checks if email is valid
 * @param email
 * @returns {boolean}
 */
const validateEmail = (email) => emailRegExp.test(email);

/**
 * Checks if given id is valid ObjectId
 * @param id
 * @returns {boolean}
 */
const isValidId = (id) => {
  if (!id) return false;

  return !!id.toString().match(/^[0-9a-fA-F]{24}$/);
};

/**
 * Returns custom short ID with 6 digit
 * @param {Number} idLength Length of the ID
 * @returns {string}
 */
const customShortId = (idLength = 6) => {
  const numbers = '0123456789';
  let data = '';

  for (let i = 0; i < idLength; i++) {
    data += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }

  return data;
};

/**
 * Logs error to file
 * @param req
 * @param err
 * @returns {object}
 */
const logError = (req, err) => {
  const logger = bunyan.createLogger({ // bunyan.createLogger() - is a function that creates a new logger object. Bunyan is a simple and fast JSON logging library for Node.js services. It is used to log errors to the file.
    name: err && err.name ? err.name : 'unknown',
    streams: [
      {
        level: 'error', // level: 'error' - is a log level that is used to log errors
        path: 'error.log', // path: 'error.log' - is a path to the file where the logs are stored
      },
    ],
  });

  logger.error({ req, error: err.toString() });
};

module.exports = {
  validateEmail,
  emailRegExp,
  customShortId,
  logError,
  isValidId,
};
