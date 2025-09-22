const { expect } = require('chai');
const request = require('supertest');
const path = require('path');
const { registerAndLogin } = require('../helpers/auth');

const restApp = require(path.join(process.cwd(), 'rest', 'app.js'));

describe('REST - Checkout', () => {
  it('deve recusar checkout sem token', async () => {
    await request(restApp)
      .post('/api/checkout')
      .send({ items: [{ productId: 1, quantity: 1 }], freight: 10, paymentMethod: 'boleto' })
      .expect(401);
  });

  it('deve calcular valor final e aplicar 5% de desconto no cartão', async () => {
    const { token } = await registerAndLogin(restApp);

    // boleto (sem desconto)
    const boleto = await request(restApp)
      .post('/api/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({
        items: [{ productId: 1, quantity: 2 }, { productId: 2, quantity: 1 }],
        freight: 20,
        paymentMethod: 'boleto'
      })
      .expect(200);

    expect(boleto.body).to.have.property('valorFinal');
    const valorBoleto = boleto.body.valorFinal;

    // cartão (com 5% de desconto)
    const cartao = await request(restApp)
      .post('/api/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({
        items: [{ productId: 1, quantity: 2 }, { productId: 2, quantity: 1 }],
        freight: 20,
        paymentMethod: 'credit_card',
        cardData: { number: '4111111111111111', name: 'QA', expiry: '12/30', cvv: '123' }
      })
      .expect(200);

    const valorCartao = cartao.body.valorFinal;

    // valida a regra: cartão = boleto * 0.95 (tolerância pequena pra ponto flutuante)
    const esperado = +(valorBoleto * 0.95).toFixed(2);
    expect(+valorCartao.toFixed(2)).to.equal(esperado);
  });
});
