import mongoose from 'mongoose';

// Configuração global para testes
beforeAll(async () => {
  // Conectar ao banco de teste
  const mongoTestURI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/controle-financas-test';
  await mongoose.connect(mongoTestURI);
});

afterAll(async () => {
  // Fechar conexão com o banco
  await mongoose.connection.close();
});

// Limpar banco entre testes
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});
