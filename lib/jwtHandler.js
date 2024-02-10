const jwt = require('jsonwebtoken');
const environments = require('../config/environments');

/**
 * Returns a jwt-signed token
 * @param {*} user User ID
 */
module.exports.issueNewToken = (user) => jwt.sign({ _id: user._id }, environments.JWT_SECRET, { expiresIn: '12h' }); // issueNewToken() - is a function that returns a jwt-signed token. It takes a user object as an argument and returns a token signed with the user's ID and the JWT_SECRET. It attaches the token to authorization header in the response object, and sends it to the client (i.e. browser, mobile app, etc.). Client stores the token in the local storage, and sends it with every request to the server, in order to authenticate the user and authorize access to the protected routes. In http request token is then checked by the expressjwt() middleware in 'app.js' file, if it exists in req.headers.authorization object, and if it does, it decodes the token and attaches the decoded token to the req.auth object.
