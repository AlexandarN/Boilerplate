const path = require('path');

const envPath = path.join(__dirname, `./environments/${process.env.NODE_ENV}.env`);
require('dotenv').config({ path: envPath }); // dotenv - is a package that loads environment variables from a .env file into process.env object. This way, the sensitive data is not exposed to the public, and is not stored in the version control system. The .env file is not included in the project repository, and is only used in the development environment. In production, environment variables are set in the server environment, and are not stored in the .env file.

/**
 * Project wide environment variables
 * If a new environment variable is added to the project,
 * add it to the respective .env file and to the object below.
 */
const environmentVariables = {
  JWT_SECRET: process.env.JWT_SECRET,
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  MONGO_DB: process.env.MONGO_DB,
  APP_URL: process.env.APP_URL,
  EMAIL_SERVICE: process.env.EMAIL_SERVICE,
  EMAIL_HOST: process.env.EMAIL_HOST,
  EMAIL_FROM: process.env.EMAIL_FROM,
  GMAIL_USER: process.env.GMAIL_USER,
  GMAIL_PASS: process.env.GMAIL_PASS,
  EMAIL_USERNAME: process.env.EMAIL_USERNAME,
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD,
};

/**
 * Returns Project environment variables based on NODE_ENV
 * @returns {Object}
 */
const getEnvVariables = () => {
  if (!environmentVariables.NODE_ENV) {
    throw new Error('Missing NODE_ENV environment variable');
  }

  if (environmentVariables.NODE_ENV === 'test') {
    return {
      NODE_ENV: environmentVariables.NODE_ENV,
      PORT: environmentVariables.PORT,
      JWT_SECRET: environmentVariables.JWT_SECRET,
    };
  }
  return environmentVariables;
};

// Check for missing environment variables
Object
  .entries(getEnvVariables())
  .forEach(([key, value]) => {
    if (!value) {
      throw new Error(`Missing ${key} environment variable`);
    }
  });

module.exports = getEnvVariables();
