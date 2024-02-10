/* eslint-disable global-require */
/* eslint-disable no-console */
const path = require('path');
const cors = require('cors');
const express = require('express');
const bodyParser = require('body-parser');
const compression = require('compression');
const { expressjwt } = require('express-jwt');
const mongoose = require('mongoose');
const mongoSanitize = require('express-mongo-sanitize');
const lusca = require('lusca');

const ErrorHandler = require('./middlewares/errorHandling/errorHandler');
const mongoDB = require('./config/database/mongodb/connection');
const environments = require('./config/environments');
const { name } = require('./package.json');

const port = environments.PORT;
const appURL = `http://localhost:${port}/api/v1/`;

const app = express();

// Application Routes
const AuthRoutes = require('./components/auth/authRouter');

app.use(cors()); // cors() - is a middleware that allows requests from any origin, and attaches the Access-Control-Allow-Origin header to the response object. If we don't use this middleware, the browser will block the request, because of the same-origin policy. This policy prevents a web page from making requests to a different domain than the one that served the web page. This is a security measure, because it prevents an attacker from being able to read the data from a different domain, and then send it to their own server. This middleware is used in the 'app.js' file, and it is set before the routes, so that it is applied to all routes in the application.
app.use(bodyParser.json({ limit: '20mb' })); // bodyParser.json() - is a middleware used to parse JSON-encoded req.bodies. When a request with a JSON payload is received, the middleware parses the JSON data and attaches it to the req.body object. It sets the Content-Type header to application/json. limit - option specifies the max size of the req.body that can be parsed. If req.body is larger than the limit, the middleware will pass an error to the next middleware.
app.use(bodyParser.urlencoded({ extended: false })); // bodyParser.urlencoded() - is a middleware used to parse URL-encoded req.bodies. When a request with a URL-encoded payload is received, the middleware parses the data and attaches it to the req.body object. It sets the Content-Type header to application/x-www-form-urlencoded.
app.use(compression()); // compression() - is a middleware used to compress HTTP responses that are sent from the server to the client's browser. Compression helps reduce the size of the response body, which can significantly improve the performance of your web application by reducing bandwidth usage and speeding up page load times. It works by compressing the response body using gzip or deflate compression algorithms, depending on what the client supports.
app.use(mongoSanitize()); // mongoSanitize() - is a middleware used to sanitize user input coming from the client's browser. It removes any keys that start with '$' or contain a '.' from the req.body, req.query, and req.params objects. This is a security measure, because it prevents NoSQL injection attacks, which are similar to SQL injection attacks, but are used to attack NoSQL databases, such as MongoDB. In a NoSQL injection attack, an attacker sends a request with a malicious payload, which is then executed by the server, and can result in unauthorized access to the database, data theft, and data manipulation.

app.disable('x-powered-by'); // disable('x-powered-by') - is a method used to remove the X-Powered-By header from the response object. This header is sent by default by the Express server, and it contains the name of the framework used to build the application. This is a security measure, because it prevents an attacker from knowing the technology stack used to build the application, and then using this information to exploit known vulnerabilities in the technology stack.

// Security
app.use(lusca.xframe('ALLOWALL')); // lusca.xframe() - is a middleware used to set the X-Frame-Options header in HTTP responses to ALLOWALL, which allows the page to be displayed in frames regardless of the origin. This can potentially expose your application to clickjacking attacks, so it's generally not recommended for production use unless you have specific requirements.
app.use(lusca.xframe('SAMEORIGIN')); // lusca.xframe() - is a middleware used to set the X-Frame-Options header in HTTP responses to SAMEORIGIN, which allows the page to be displayed in a frame on the same origin as the page itself. This helps prevent clickjacking attacks by ensuring that the page can only be embedded in frames from the same origin.
app.use(lusca.xssProtection(true)); // lusca.xssProtection() - is a middleware used to set the X-XSS-Protection header in HTTP responses, which helps protect your application from cross-site scripting (XSS) attacks. When set to true, the X-XSS-Protection header is set to 1; mode=block, instructing the browser to enable its built-in XSS protection mechanisms.

// JWT Middleware
app.use(expressjwt({ secret: environments.JWT_SECRET, algorithms: ['HS256'] }).unless({ // expressjwt() - is a middleware that checks if the token exists in the request header (i.e.in req.headers.authorization), and if it does, it decodes the token and attaches the decoded user ID to the req.auth object, which is then used by the permissionAccess() middleware to check if the user has the necessary permissions to access the route. If the token is not present, it throws an error and passes it to the error handling middleware, which is set in 'app.js' as the last middleware in the chain. algorithm: ['HS256'] - is the algorithm used to decode the token.
  // Whitelisted routes
  path: [
    // Auth
    '/api/v1/signin',
    '/api/v1/refresh-token',
    '/api/v1/forgot-password',
    /\/api\/v1\/reset-password\/\w*/,
    // API docs
    /\/apidoc\/?/,
  ],
}));

// Protected routes
app.use('/api/v1', AuthRoutes);

// Create the database connection
mongoose.connect(mongoDB.connectionString());

mongoose.connection.on('connected', () => {
  console.log(`Mongoose default connection open to ${mongoDB.connectionString()}`);
});

mongoose.connection.on('error', (err) => {
  console.log(`Mongoose default connection error: ${err}`);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose default connection disconnected');
});

mongoose.connection.on('open', () => {
  console.log('Mongoose default connection is open');
});

process.on('SIGINT', () => { // SIGINT - is a signal sent to the process by the operating system, when the user presses Ctrl+C in the terminal. It is used to gracefully shut down the server, and close the database connection, before the server process is terminated.
  mongoose.connection.close()
    .then(() => console.log('Mongoose default connection disconnected through app termination'))
    .catch((err) => console.log(err))
    .finally(() => process.exit(0));
});

// Create API documentation only in DEV environment
if (environments.NODE_ENV === 'development') {
  // eslint-disable-next-line import/no-extraneous-dependencies
  const { createDoc } = require('apidoc');

  const apiDocsLocation = path.resolve(__dirname, 'doc');

  const doc = createDoc({
    src: [path.resolve(__dirname, 'components')],
    dest: apiDocsLocation,
    dryRun: false,
    silent: false,
  });

  app.use('/api/v1/apidoc', express.static(path.join(__dirname, '/doc')));

  if (typeof doc !== 'boolean') {
    console.log(`Apidoc generated at ${apiDocsLocation}`);
  }
}

// Error handling middleware
app.use(ErrorHandler());

// Log server start and env variables
console.log(`__________ ${name} __________`);
console.log('Time server started:', new Date());
console.log(`Starting on port: ${port}`);
console.log(`Env: ${environments.NODE_ENV}`);
console.log(`App url: ${appURL}`);
console.log('______________________________');

app.listen(port);

module.exports = app;
