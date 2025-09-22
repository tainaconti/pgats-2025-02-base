const { expect } = require('chai');
const request = require('supertest');
const path = require('path');

const gqlApp = require(path.join(process.cwd(), 'graphql', 'app.js'));

const REGISTER = `
mutation($name:String!, $email:String!, $password:String!) {
  register(name:$name, email:$email, password:$password) { email }
}
`;
const LOGIN = `
mutation($email:String!, $password:String!) {
  login(email:$email, password:$password) { token }
}
`;
const CHECKOUT = `
mutation Checkout($items: [CheckoutItemInput!]!, $freight: Float!, $paymentMethod: String!, $cardData: CardDataInput) {
  checkout(items: $items, freight: $freight, paymentMethod: $paymentMethod, cardData: $cardData) {
    valorFinal
    paymentMethod
    freight
    items { productId quantity }
  }
}
`;

describe('GraphQL - Checkout', () => {
  it('deve aplicar 5% de desconto no cartão', async () => {
    const unique = Date.now();
    const email = `gql_checkout_${unique}@email.com`;

    await request(gqlApp).post('/graphql').send({
      query: REGISTER, variables: { name: 'QA', email, password: '123456' }
    });

    const login = await request(gqlApp).post('/graphql').send({
      query: LOGIN, variables: { email, password: '123456' }
    });

    const token = login.body.data.login.token;

    // boleto
    const boleto = await request(gqlApp)
      .post('/graphql')
      .set('Authorization', `Bearer ${token}`)
      .send({
        query: CHECKOUT,
        variables: {
          items: [{ productId: 1, quantity: 2 }, { productId: 2, quantity: 1 }],
          freight: 15,
          paymentMethod: "boleto"
        }
      }).expect(200);

    const valorBoleto = boleto.body.data.checkout.valorFinal;

    // cartão
    const cartao = await request(gqlApp)
      .post('/graphql')
      .set('Authorization', `Bearer ${token}`)
      .send({
        query: CHECKOUT,
        variables: {
          items: [{ productId: 1, quantity: 2 }, { productId: 2, quantity: 1 }],
          freight: 15,
          paymentMethod: "credit_card",
          cardData: { number: "4111111111111111", name: "QA", expiry: "12/30", cvv: "123" }
        }
      }).expect(200);

    const valorCartao = cartao.body.data.checkout.valorFinal;
    const esperado = +(valorBoleto * 0.95).toFixed(2);
    expect(+valorCartao.toFixed(2)).to.equal(esperado);
  });
});
