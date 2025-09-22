const { expect } = require('chai');
const sinon = require('sinon');
const path = require('path');

// importa o controller e o service exatamente como no seu código
const userController = require(path.join(process.cwd(), 'rest', 'controllers', 'userController.js'));
const userService   = require(path.join(process.cwd(), 'src', 'services', 'userService.js'));

// helper simples pra simular res.status().json()
function makeRes() {
  return {
    statusCode: 200,
    jsonBody: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.jsonBody = payload; return this; }
  };
}

describe('Controller: userController', () => {
  afterEach(() => sinon.restore());

  describe('register', () => {
    it('retorna 201 e { user } quando service cria com sucesso', () => {
      const fakeUser = { id: 1, name: 'QA', email: 'qa@email.com' };
      const stub = sinon.stub(userService, 'registerUser').returns(fakeUser);

      const req = { body: { name: 'QA', email: 'qa@email.com', password: '123456' } };
      const res = makeRes();

      userController.register(req, res);

      expect(stub.calledOnceWith('QA', 'qa@email.com', '123456')).to.be.true;
      expect(res.statusCode).to.equal(201);
      expect(res.jsonBody).to.deep.equal({ user: fakeUser });
    });

    it('retorna 400 quando service indica e-mail já cadastrado', () => {
      const stub = sinon.stub(userService, 'registerUser').returns(null); // controller trata como erro

      const req = { body: { name: 'QA', email: 'dup@email.com', password: '123456' } };
      const res = makeRes();

      userController.register(req, res);

      expect(stub.calledOnce).to.be.true;
      expect(res.statusCode).to.equal(400);
      expect(res.jsonBody).to.have.property('error', 'Email já cadastrado');
    });
  });

  describe('login', () => {
    it('retorna 200 e o objeto do service (ex.: { token }) quando credenciais válidas', () => {
      const fakeResult = { token: 'token_falso' };
      const stub = sinon.stub(userService, 'authenticate').returns(fakeResult);

      const req = { body: { email: 'qa@email.com', password: '123456' } };
      const res = makeRes();

      userController.login(req, res);

      expect(stub.calledOnceWith('qa@email.com', '123456')).to.be.true;
      expect(res.statusCode).to.equal(200);
      expect(res.jsonBody).to.deep.equal(fakeResult);
    });

    it('retorna 401 quando credenciais inválidas', () => {
      const stub = sinon.stub(userService, 'authenticate').returns(null);

      const req = { body: { email: 'qa@email.com', password: 'errada' } };
      const res = makeRes();

      userController.login(req, res);

      expect(stub.calledOnce).to.be.true;
      expect(res.statusCode).to.equal(401);
      expect(res.jsonBody).to.have.property('error', 'Credenciais inválidas');
    });
  });
});
