const { expect } = require('chai');
const request = require('supertest');
const path = require('path');

const app = require(path.join(process.cwd(), 'rest', 'app.js'));

const unique = () => `${Date.now()}_${Math.floor(Math.random()*1000)}`;

describe('REST - Auth', () => {
  it('registra usuário com sucesso', async () => {
    const email = `qa_${unique()}@email.com`;

    const res = await request(app)
      .post('/api/users/register')
      .send({ name: 'QA', email, password: '123456' })
      .expect(201);

    expect(res.body).to.include({ email, name: 'QA' });
  });

  it('loga usuário com sucesso', async () => {
    const email = `qa_${unique()}@email.com`;

    await request(app)
      .post('/api/users/register')
      .send({ name: 'QA', email, password: '123456' })
      .expect(201);

    const login = await request(app)
      .post('/api/users/login')
      .send({ email, password: '123456' })
      .expect(200);

    expect(login.body).to.have.property('token').that.is.a('string');
  });

  it('não permite login com senha errada', async () => {
    const email = `qa_${unique()}@email.com`;

    await request(app)
      .post('/api/users/register')
      .send({ name: 'QA', email, password: '123456' })
      .expect(201);

    const login = await request(app)
      .post('/api/users/login')
      .send({ email, password: 'errada' })
      .expect(401);

    expect(login.body).to.have.property('message');
  });
});
