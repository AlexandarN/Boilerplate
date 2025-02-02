module.exports = {
  AUTHORIZATION_TOKEN: 'NoAuthorizationToken',
  MISSING_PARAMETERS: 'MissingParameters',
  NOT_ACCEPTABLE: 'NotAcceptable',
  NOT_FOUND: 'NotFound',
  FORBIDDEN: 'Forbidden',
  INVALID_VALUE: 'InvalidValue',
  BAD_REQUEST: 'BadRequest',
  CREDENTIALS_ERROR: 'CredentialsError',
  INVALID_EMAIL: 'InvalidEmail',
  DUPLICATE_EMAIL: 'DuplicateEmail',
  UNAUTHORIZED_ERROR: 'UnauthorizedError',
  INACTIVE_ACCOUNT: 'InactiveAccount',
  EXISTING_USER: 'ExistingUser',
  IS_LOCKED_ERROR: 'IsLockedError',
  DELETION_FORBIDDEN: (itemName, documentName, resourceName) => ['DeletionForbidden', itemName, documentName, resourceName],
};
