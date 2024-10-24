const { logError } = require('../../lib/misc');
const errorConstantsObj = require('./errorConstants');
const environments = require('../../config/environments');

module.exports = () => (err, req, res, next) => { // err - is the error object, that has been thrown in controllers, which contains the message title, e.g. 'NotFound'
                                                  // When we throw an error in endpoint function, the error is caught by the 'catchAsyncError() middleware, and then passed automatically to the next middleware, which is 'errorHandler.js' in our case, and we have set this middleware pipeline in 'app.js'
  const error = {};

  // console.log('err', err);

  switch (err.message) { // err.message is the message title, e.g. 'NotFound'
    case errorConstantsObj.AUTHORIZATION_TOKEN: // errorConstantsObj.AUTHORIZATION_TOKEN is the message title that is set in 'errorConstants.js', e.g. 'NotFound'. We pull this from errorConstants.js file.
      error.message = 'No authorization token was found';
      error.status = 401;
      error.errorCode = 1;
      break;
    case errorConstantsObj.MISSING_PARAMETERS:
      error.message = 'Missing parameters';
      error.status = 400;
      error.errorCode = 2;
      break;
    case errorConstantsObj.NOT_ACCEPTABLE:
      error.status = 406;
      error.message = 'Not acceptable';
      error.errorCode = 3;
      break;
    case errorConstantsObj.NOT_FOUND:
      error.status = 404;
      error.message = 'Not Found';
      error.errorCode = 4;
      break;
    case errorConstantsObj.FORBIDDEN:
      error.status = 403;
      error.message = 'Forbidden';
      error.errorCode = 5;
      break;
    case errorConstantsObj.INVALID_VALUE:
      error.status = 400;
      error.message = 'Value is not valid';
      error.errorCode = 6;
      break;
    case errorConstantsObj.BAD_REQUEST:
      error.status = 400;
      error.message = 'Bad Request';
      error.errorCode = 7;
      break;
    case errorConstantsObj.CREDENTIALS_ERROR:
      error.status = 401;
      error.message = 'Wrong credentials';
      error.errorCode = 8;
      break;
    case errorConstantsObj.INVALID_EMAIL:
      error.status = 400;
      error.message = 'Please fill a valid email address';
      error.errorCode = 9;
      break;
    case errorConstantsObj.DUPLICATE_EMAIL:
      error.status = 409;
      error.message = 'This email address is already registered';
      error.errorCode = 10;
      break;
    case errorConstantsObj.UNAUTHORIZED_ERROR:
      error.status = 401;
      error.message = 'Invalid credentials';
      error.errorCode = 11;
      break;
    case err.message.startsWith(errorConstantsObj.INACTIVE_ACCOUNT):
      error.status = 401;
      error.message = 'This account is not active';
      error.errorCode = 12;
      break;
    case err.message.startsWith(errorConstantsObj.EXISTING_USER):
      error.status = 409;
      error.message = 'This user already exists';
      error.errorCode = 13;
      break;
    case err.message.startsWith(errorConstantsObj.IS_LOCKED_ERROR):
      error.status = 423;
      error.message = 'Dokument je zaključan';
      error.errorCode = 14;
      break;
    case 'jwt expired':
      error.status = 401;
      error.message = 'Token expired';
      error.errorCode = 15;
      break;
    default:
      error.status = 500;
      error.message = 'Oops, an error occurred';
      error.errorCode = 0;
  }

  if (error.status === 500) {
    logError(req, err);
    if (environments.NODE_ENV === 'test') console.log(err);
  }

  if (environments.NODE_ENV === 'development') {
    error.stack = err.stack;
  }

  return res.status(error.status).send(error);
};
