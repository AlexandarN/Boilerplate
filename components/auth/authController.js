const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const error = require('../../middlewares/errorHandling/errorConstants'); // error - is the object, created in the 'errorConstants'.js file. It contains as keys all the error names, that we throw here in controller, and as values - the error message titles that we use in 'errorHandler.js' file, in order to create the error object that will contain the appropriate error message, status and errorCode.
const { JWT_SECRET } = require('../../config/environments');
const { issueNewToken } = require('../../lib/jwtHandler');
const { customShortId } = require('../../lib/misc');
const { sendEmail, emailTemplates } = require('../../lib/emailHandler');
const { User } = require('../../models');

/**
 * @api {post} /signin Sign in User
 * @apiVersion 1.0.0
 * @apiName Sign in User
 * @apiGroup Auth
 * @apiDescription Sign in User
 * @apiPermission none
 *
 * @apiBody {String} email Email
 * @apiBody {String} password Password
 *
 * @apiSuccessExample Success-Response:
 HTTP/1.1 200 OK
  {
    "message": "Successfully signed in",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1OWFlNzAwMGJmZDgyNzNhYjI3ZDVmYTki",
    "results": {
      "_id": "59ae7000bfd8273ab27d5fa9",
      "updatedAt": "2017-09-05T09:36:00.581Z",
      "createdAt": "2017-09-05T09:36:00.581Z",
      "email": "user@email.com",
      "name": "Someone New",
      "__v": 0,
      "isActive": true
    }
  }
 *
 * @apiUse MissingParameters
 * @apiUse NotFound
 * @apiUse Forbidden
 * @apiUse CredentialsError
 */
module.exports.signIn = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) throw new Error(error.MISSING_PARAMETERS); // This is actually: throw new Error('MissingParameters'); Creates an error object with a message title 'MissingParameters' and passes it to the next middleware in the pipeline, which is 'errorHandler.js' in our case.

  // Find user in DB
  const user = await User.findOne(
    { email: email.toLowerCase() },
    {
      password: 1,
      isActive: 1,
    },
  ).lean();

  if (!user) throw new Error(error.NOT_FOUND);

  if (!user.isActive) throw new Error(error.FORBIDDEN);

  if (!bcrypt.compareSync(password, user.password)) throw new Error(error.CREDENTIALS_ERROR);

  // Remove password from response
  delete user.password;

  return res.status(200).send({
    message: 'Successfully signed in',
    token: issueNewToken(user),
    results: user,
  });
};

/**
 * @api {post} /forgot-password Forgot password
 * @apiVersion 1.0.0
 * @apiName Forgot password
 * @apiGroup Auth
 * @apiDescription Forgot password
 * @apiPermission none
 *
 * @apiBody {String} email Email
 *
 * @apiSuccessExample Success-Response:
 HTTP/1.1 200 OK
  {
    "message": "Successfully generated reset token"
  }
 *
 * @apiUse MissingParameters
 * @apiUse NotFound
 */
module.exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) throw new Error(error.MISSING_PARAMETERS);

  const resetToken = customShortId();

  // Find user in DB
  const user = await User.findOne({ email: email.toLowerCase() }).lean();

  if (!user) throw new Error(error.NOT_FOUND);

  // Update user with reset token
  await User.updateOne(
    { email },
    { resetToken },
  );

  // Send email with reset token
  await sendEmail(
    email,
    'Reset Password',
    emailTemplates.forgotPassword({ userName: user.name, resetToken }),
  );

  return res.status(200).send({
    message: 'Successfully generated reset token',
  });
};

/**
 * @api {post} /reset-password/:resetToken Reset password
 * @apiVersion 1.0.0
 * @apiName Reset password
 * @apiGroup Auth
 * @apiDescription Reset password
 * @apiPermission none
 *
 * @apiParam {String} resetToken ResetToken
 * @apiBody {String} password New password
 * @apiBody {String} passwordConfirm New password confirmation
 *
 * @apiSuccessExample Success-Response:
 HTTP/1.1 200 OK
  {
    "message": "Password updated",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
  }
 *
 * @apiUse MissingParameters
 * @apiUse InvalidValue
 * @apiUse NotFound
 */
module.exports.resetPassword = async (req, res) => {
  const { resetToken } = req.params;
  const { password, passwordConfirm } = req.body;

  if (!password || !passwordConfirm || !resetToken) throw new Error(error.MISSING_PARAMETERS);

  if (password !== passwordConfirm) throw new Error(error.INVALID_VALUE);

  const newPassword = bcrypt.hashSync(password, 10);

  // Update user with new password and remove reset token
  const user = await User.findOneAndUpdate(
    { resetToken },
    {
      $set: { password: newPassword },
      $unset: { resetToken: '' },
    },
    { new: true },
  );

  if (!user) throw new Error(error.NOT_FOUND);

  return res.status(200).send({
    message: 'Password updated',
    token: issueNewToken(user),
  });
};

/**
 * @api {post} /refresh-token Refresh token
 * @apiVersion 1.0.0
 * @apiName refreshToken
 * @apiDescription Refresh token
 * @apiGroup Auth
 * @apiDescription Refresh token
 * @apiPermission none
 *
 * @apiBody {String} token User's expired token
 *
 * @apiSuccessExample Success-Response:
 HTTP/1.1 200 OK
  {
    "message": "Successfully refreshed token",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpX..."
  }
 *
 * @apiUse MissingParameters
 * @apiUse NotFound
 */
module.exports.refreshToken = async (req, res) => {
  const { token } = req.body;

  if (!token) throw new Error(error.MISSING_PARAMETERS);

  // Extract user from token
  const decoded = jwt.decode(token, JWT_SECRET);

  if (decoded === null) throw new Error(error.NOT_FOUND);

  // Find user in DB
  const user = await User.findOne({ _id: decoded._id }).lean();

  if (!user) throw new Error(error.NOT_FOUND);

  return res.status(200).send({
    message: 'Successfully refreshed token',
    token: issueNewToken(user),
  });
};

/**
 * @api {post} /change-password Change password
 * @apiVersion 1.0.0
 * @apiName Change password
 * @apiGroup Auth
 * @apiDescription Change password
 * @apiPermission User
 *
 * @apiBody {String} oldPassword User's old password
 * @apiBody {String} newPassword User's new password to set to
 * @apiBody {String} newPasswordConfirm User's new password confirm
 *
 * @apiSuccessExample Success-Response:
 HTTP/1.1 200 OK
  {
    "message": "Password successfully updated",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpX..."
  }
 *
 * @apiUse MissingParameters
 * @apiUse InvalidValue
 * @apiUse NotFound
 * @apiUse CredentialsError
 */
module.exports.changePassword = async (req, res) => {
  const { _id } = req.user;
  const { oldPassword, newPassword, newPasswordConfirm } = req.body;

  if (!oldPassword || !newPassword) throw new Error(error.MISSING_PARAMETERS);

  if (newPassword !== newPasswordConfirm) throw new Error(error.INVALID_VALUE);

  // Find user in DB
  const user = await User.findById(
    { _id },
    { password: 1 },
  ).lean();

  if (!user) throw new Error(error.NOT_FOUND);

  if (!bcrypt.compareSync(oldPassword, user.password)) throw new Error(error.CREDENTIALS_ERROR);

  const password = bcrypt.hashSync(newPassword, 10);

  // Update user with new password
  await User.updateOne(
    { _id },
    { password },
  );

  return res.status(200).send({
    message: 'Password successfully updated',
    token: issueNewToken(user),
  });
};

/**
 * @api {get} /profile Get my profile
 * @apiVersion 1.0.0
 * @apiName Get my profile
 * @apiGroup Auth
 * @apiDescription Get my profile
 * @apiPermission User
 *
 * @apiSuccessExample Success-Response:
 HTTP/1.1 200 OK
  {
    "message": "Successfully returned profile",
    "results": {
      "_id": "59ae7000bfd8273ab27d5fa9",
      "updatedAt": "2017-09-05T09:36:00.581Z",
      "createdAt": "2017-09-05T09:36:00.581Z",
      "email": "user@email.com",
      "name": "Someone New",
      "__v": 0,
      "isActive": true
    }
  }
 */
module.exports.getProfile = async (req, res) => res.status(200).send({
  message: 'Successfully returned profile',
  results: req.user,
});
