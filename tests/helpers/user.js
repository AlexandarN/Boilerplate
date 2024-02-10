const { faker } = require('@faker-js/faker');

const { issueNewToken } = require('../../lib/jwtHandler');
const { User } = require('../../models');

/**
 * Creates a new user
 * @param {String} name First and last name
 * @param {String} email Email
 * @param {String} password Password
 * @param {Boolean} isActive Is user active
 *
 * @returns {Promise} returns new user
 */
const createUser = async ({
  name = `${faker.person.firstName()} ${faker.person.firstName()}`,
  email = faker.internet.email(),
  password = faker.internet.password(),
  isActive = true,
} = {}) => {
  const user = await new User({
    name,
    email,
    password,
    isActive,
  }).save();

  const token = issueNewToken(user);

  return {
    user,
    token,
  };
};

/**
 * Creates many new users
 * @param {Number} numberOfUsers Number of users to generate
 *
 * @returns {Promise} returns new users
 */
const createManyUsers = async (numberOfUsers) => {
  let users = [];

  for (let i = 0; i < numberOfUsers; i++) {
    users.push({
      name: `${faker.person.firstName()} ${faker.person.lastName()}`,
      email: faker.internet.email(),
      password: faker.internet.password(),
      isActive: true,
    });
  }

  users = await User.insertMany(users);

  return users;
};

module.exports = {
  createUser,
  createManyUsers,
};