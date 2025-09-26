import request from 'supertest';
import app from '../server';
import User from '../models/User';
import connectDB from '../config/database';

describe('Auth Routes', () => {
  beforeAll(async () => {
    // Conectar ao banco de teste
    await connectDB();
  });

  beforeEach(async () => {
    // Limpar banco antes de cada teste
    await User.deleteMany({});
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        name: 'João Silva',
        email: 'joao@email.com',
        password: 'senha123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.password).toBeUndefined();
    });

    it('should not register user with existing email', async () => {
      const userData = {
        name: 'João Silva',
        email: 'joao@email.com',
        password: 'senha123'
      };

      // Criar primeiro usuário
      await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Tentar criar segundo usuário com mesmo email
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('já existe');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Criar usuário para teste de login
      const userData = {
        name: 'João Silva',
        email: 'joao@email.com',
        password: 'senha123'
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData);
    });

    it('should login with valid credentials', async () => {
      const loginData = {
        email: 'joao@email.com',
        password: 'senha123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(loginData.email);
      expect(response.body.data.token).toBeDefined();
    });

    it('should not login with invalid credentials', async () => {
      const loginData = {
        email: 'joao@email.com',
        password: 'senhaerrada'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('inválidas');
    });

    it('should not login with non-existent user', async () => {
      const loginData = {
        email: 'naoexiste@email.com',
        password: 'senha123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('inválidas');
    });
  });

  describe('GET /api/auth/verify', () => {
    let token: string;

    beforeEach(async () => {
      // Criar usuário e obter token
      const userData = {
        name: 'João Silva',
        email: 'joao@email.com',
        password: 'senha123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      token = response.body.data.token;
    });

    it('should verify valid token', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('joao@email.com');
    });

    it('should not verify invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'Bearer token-invalido')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('inválido');
    });

    it('should not verify without token', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('não fornecido');
    });
  });
});
