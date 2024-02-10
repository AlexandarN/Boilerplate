const request = require('supertest');
const { describe, it } = require('mocha');
const { expect } = require('chai');
const { faker } = require('@faker-js/faker');

const app = require('../../app');
const { createUser } = require('../helpers/user');

describe('Signin', () => {
  it('POST /signin Should return missing parameters if password has not been sent', async () => {
    const body = {
      email: faker.internet.email(),
    };

    const res = await request(app)
      .post('/api/v1/signin')
      .set('Accept', 'application/json')
      .send(body)
      .expect(400);

    const { message } = res.body;
    expect(message).to.equal('Missing parameters');
  });

  it('POST /signin Should return not found', async () => {
    const body = {
      email: faker.internet.email(),
      password: faker.internet.password(),
    };

    const res = await request(app)
      .post('/api/v1/signin')
      .set('Accept', 'application/json')
      .send(body)
      .expect(404);

    const { message } = res.body;
    expect(message).to.equal('Not Found');
  });

  it('POST /signin Should successfully signin', async () => {
    const password = faker.internet.password();
    const { user } = await createUser({ password });

    const body = {
      email: user.email,
      password,
    };

    const res = await request(app)
      .post('/api/v1/signin')
      .set('Accept', 'application/json')
      .send(body)
      .expect(200);

    const { message } = res.body;
    expect(message).to.equal('Successfully signed in');
  });
});
