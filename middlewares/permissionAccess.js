const { User } = require('../models/user');
const error = require('./errorHandling/errorConstants');

/**
 * Ensure that requested User exists and is active
 */
module.exports.permissionAccess = () => async (req, res, next) => {
  try {
    const { _id: loggedInUserId } = req.auth; // req.auth - is an object that is attached to the request object by the expressjwt() middleware in 'app.js' file, if the token exists in the request header (i.e.in req.headers.authorization), it decodes the token and attaches the decoded user ID to the req.auth object

    // Find user in DB
    const user = await User.findById(loggedInUserId).lean();

    if (!user || !user.isActive) throw new Error(error.NOT_FOUND);

    req.user = user;

    return next();
  } catch (err) {
    return next(err);
  }
};
