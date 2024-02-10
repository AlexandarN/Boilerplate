const express = require('express');

const AuthController = require('./authController');
const { catchAsyncError } = require('../../lib/functionErrorHandler');
const { permissionAccess } = require('../../middlewares/permissionAccess');

const router = express.Router();

router
  // Whitelisted routes
  .post('/signin', catchAsyncError(AuthController.signIn)) // catchAsyncError() - is a middleware created in 'lib/functionErrorHandler.js', which catches the error thrown in the controller function and passes it with the next() method to the next middleware function, which is the error handling middleware 'errorHandler', and this is set in 'app.js' as the last middleware in the chain.
  .post('/forgot-password', catchAsyncError(AuthController.forgotPassword))
  .post('/reset-password/:resetToken', catchAsyncError(AuthController.resetPassword))
  .post('/refresh-token', catchAsyncError(AuthController.refreshToken))

  // Protected routes
  .post('/change-password', permissionAccess(), catchAsyncError(AuthController.changePassword)) // permissionAccess() - is a middleware created in 'middlewares/permissionAccess.js', which checks if the user has the necessary permissions to access the route. If the user has the necessary permissions, the middleware passes the request to the next middleware in the chain, otherwise it throws an error and passes it to the error handling middleware 'errorHandler'.
  .get('/profile', permissionAccess(), catchAsyncError(AuthController.getProfile));

module.exports = router;
