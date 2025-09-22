const { expect } = require('chai');
const request = require('supertest');
const path = require('path');

const gqlApp = require(path.join(process.cwd(), 'graphql', 'app.js'));

const REGISTER = `
mutation Register($name: String!, $email: String!, $password: String!) {
  register(name: $name, email: $email, password: $password) {
    email
    name
  }
}
`;

const LOGIN = `
mutation Login($email: String!, $password: String!) {
  login(email: $email, password: $password) {
    token
  }
}
`;

describe('GraphQL - Auth', () => {
  it('deve registrar e logar usuário (GraphQL)', async () => {
    const unique = Date.now();
    const email = `gql_${unique}@email.com`;

    const reg = await request(gqlApp)
      .post('/graphql')
      .send({ query: REGISTER, variables: { name: 'QA GQL', email, password: '123456' } })
      .expect(200);

    expect(reg.body.data.register).to.include({ email, name: 'QA GQL' });

    const login = await request(gqlApp)
      .post('/graphql')
      .send({ query: LOGIN, variables: { email, password: '123456' } })
      .expect(200);

    expect(login.body.data.login.token).to.be.a('string');
  });
});
