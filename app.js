/* eslint-disable global-require */
/* eslint-disable no-console */
const path = require('path');
const cors = require('cors');
const express = require('express');
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

// Middlewares
app.use(cors()); // Middleware that allows requests from other domains. It enables the server to handle requests from different origins. It is used to prevent the Same Origin Policy restriction implemented by browsers. This policy prevents a web page from making requests to a different domain than the one that served the web page. This is a security measure to prevent attackers from exploiting the users' credentials and then perform malicious actions on their behalf, such as stealing sensitive information or sending requests to the server on their behalf.
app.use(express.json({ limit: '20mb' })); // Middleware used to parse JSON-encoded req. bodies. When a request with a JSON payload is received, the middleware uses the json() method to parse the JSON payload into a JS object, and attaches it to req.body. It sets the Content-Type header to application/json. Limit - option sepcifies the max size of the req.body that can be parsed. This is used to prevent attacks that send large request bodies to consume server resources.
app.use(express.urlencoded({ extended: false })); // Middleware used to parse URL-encoded req. bodies. When a request with a URL-encoded payload is received, the middleware parses the payload into a JS object, and attaches it to req.body. It sets the Content-Type header to application/x-www-form-urlencoded. Extended - option allows to choose between parsing the URL-encoded data with the querystring library (when false) or the qs library (when true). Querystring library is used to parse URL-encoded data, and qs library is used to parse complex objects (arrays, nested objects).
app.use(compression()); // Middleware used to compress HTTP responses that are sent from the server to the client's browser. Compression helps reduce the size of the response body, which can significantly improve the performance of your web application by reducing bandwidth usage and speeding up page load times. It works by compressing the response body using gzip or deflate compression algorithms, depending on what the client supports.
app.use(mongoSanitize()); // Middleware used to sanitize user input coming from the client's browser. It removes any keys that start with '$' or contain a '.' from the req.body, req.query, and req.params objects. This is a security measure, because it prevents NoSQL injection attacks, which are similar to SQL injection attacks, but are used to attack NoSQL databases, such as MongoDB. In a NoSQL injection attack, an attacker sends a request with a malicious payload, which is then executed by the server, and can result in unauthorized access to the database, data theft, and data manipulation.
app.disable('x-powered-by'); // disable('x-powered-by') - is a method used to remove the X-Powered-By header from the response object. This header is sent by default by the Express server, and it contains the name of the framework used to build the application. This is a security measure, because it prevents an attacker from knowing the technology stack used to build the application, and then using this information to exploit known vulnerabilities in the technology stack.

// Security
app.use(lusca.xframe('SAMEORIGIN')); // lusca.xframe() - is a middleware used to set the X-Frame-Options header in HTTP responses to SAMEORIGIN, which allows the page to be displayed in a frame on the same origin as the page itself. This helps prevent clickjacking attacks by ensuring that the page can only be embedded in frames from the same origin.
app.use(lusca.xssProtection(true)); // lusca.xssProtection() - is a middleware used to set the X-XSS-Protection header in HTTP responses, which helps protect your application from cross-site scripting (XSS) attacks. When set to true, the X-XSS-Protection header is set to 1; mode=block, instructing the browser to enable its built-in XSS protection mechanisms. This helps prevent attackers from injecting malicious scripts into your web pages, which can be used to steal sensitive information or perform other malicious actions.

// JWT Middleware
app.use(expressjwt({ secret: environments.JWT_SECRET, algorithms: ['HS256'] }).unless({ // expressjwt() - is a middleware that checks if the token exists in the request header (i.e.in req.headers.authorization), and if it does, it decodes the token and attaches the decoded user ID to the req.auth object, which is then used by the permissionAccess() middleware to check if the user has the necessary permissions to access the route. If the token is not present, it throws an error and passes it to the error handling middleware, which is set in 'app.js' as the last middleware in the chain. algorithm: ['HS256'] - is the algorithm used to decode the token.
  // Whitelisted routes that do not require JWT authentication
  path: [
    // Auth routes
    '/api/v1/signin',
    '/api/v1/refresh-token',
    '/api/v1/forgot-password',
    /\/api\/v1\/reset-password\/\w*/,
    // API documentation routes
    /\/apidoc\/?/,
  ],
}));

// Protected routes
const AuthRoutes = require('./components/auth/authRouter');
app.use('/api/v1', AuthRoutes);

// Create the database connection
mongoose.connect(mongoDB.connectionString());

mongoose.connection.on('connected', () => {
  console.log(`Mongoose default connection connected to ${mongoDB.connectionString()}`);
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

process.on('SIGINT', () => { // SIGINT - is a signal sent to the process by the operating system when the user presses Ctrl+C in the terminal. It is used to gracefully shut down the server and close the database connection, before the server process is terminated.
  mongoose.connection.close()
    .then(() => console.log('Mongoose default connection disconnected through app termination'))
    .catch((err) => console.log(err))
    .finally(() => process.exit(0));
});

// Create API documentation only in DEV environment
if (environments.NODE_ENV === 'development') {
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
    console.log(`\nApidoc generated at ${apiDocsLocation}\n`);
  }
}

// Catch-all error handler for unhandled routes
app.use((req, res, next) => {
  const error = new Error(`ROUTE NOT FOUND: ${req.originalUrl}`);
  error.status = 404;
  next(error);
});

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
