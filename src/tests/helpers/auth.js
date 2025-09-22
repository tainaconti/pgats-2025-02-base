const request = require('supertest');
const { expect } = require('chai');

async function registerAndLogin(app, { name = 'Taina QA', email, password = '123456' } = {}) {
  const unique = Date.now();
  const safeEmail = email || `taina_${unique}@email.com`;

  // registro
  const reg = await request(app)
    .post('/api/users/register')
    .send({ name, email: safeEmail, password })
    .expect(201);

  expect(reg.body).to.have.property('email', safeEmail);

  // login
  const login = await request(app)
    .post('/api/users/login')
    .send({ email: safeEmail, password })
    .expect(200);

  expect(login.body).to.have.property('token');
  return { token: login.body.token, email: safeEmail };
}

module.exports = { registerAndLogin };
