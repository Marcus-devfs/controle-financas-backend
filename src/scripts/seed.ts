import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import Category from '../models/Category';
import CreditCard from '../models/CreditCard';

// Carregar variáveis de ambiente
dotenv.config();

const seedData = async () => {
  try {
    // Conectar ao banco
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/controle-financas');
    console.log('Conectado ao MongoDB');

    // Limpar dados existentes
    await User.deleteMany({});
    await Category.deleteMany({});
    await CreditCard.deleteMany({});
    console.log('Dados existentes removidos');

    // Criar usuário de exemplo
    const user = new User({
      name: 'Usuário Exemplo',
      email: 'usuario@exemplo.com',
      password: 'senha123'
    });
    await user.save();
    console.log('Usuário criado:', user.email);

    // Criar categorias padrão
    const defaultCategories = [
      // Receitas
      { name: 'Salário', type: 'income', color: '#10B981' },
      { name: 'Bônus', type: 'income', color: '#3B82F6' },
      { name: 'Freelance', type: 'income', color: '#8B5CF6' },
      { name: 'Investimentos', type: 'income', color: '#84CC16' },
      
      // Despesas
      { name: 'Aluguel', type: 'expense', color: '#EF4444' },
      { name: 'Contas', type: 'expense', color: '#F59E0B' },
      { name: 'Alimentação', type: 'expense', color: '#EC4899' },
      { name: 'Transporte', type: 'expense', color: '#06B6D4' },
      { name: 'Saúde', type: 'expense', color: '#F97316' },
      { name: 'Educação', type: 'expense', color: '#6366F1' },
      { name: 'Lazer', type: 'expense', color: '#8B5CF6' },
      { name: 'Roupas', type: 'expense', color: '#EC4899' },
      
      // Investimentos
      { name: 'Ações', type: 'investment', color: '#84CC16' },
      { name: 'Fundos', type: 'investment', color: '#10B981' },
      { name: 'Criptomoedas', type: 'investment', color: '#F59E0B' },
      { name: 'Tesouro Direto', type: 'investment', color: '#3B82F6' }
    ];

    const categories = await Category.insertMany(
      defaultCategories.map(cat => ({
        ...cat,
        userId: user._id
      }))
    );
    console.log(`${categories.length} categorias criadas`);

    // Criar cartões de crédito de exemplo
    const creditCards = [
      {
        name: 'Cartão Principal',
        lastFourDigits: '1234',
        brand: 'visa' as const,
        limit: 5000,
        closingDay: 5,
        dueDay: 10,
        color: '#3B82F6',
        isActive: true
      },
      {
        name: 'Cartão Secundário',
        lastFourDigits: '5678',
        brand: 'mastercard' as const,
        limit: 3000,
        closingDay: 15,
        dueDay: 20,
        color: '#EF4444',
        isActive: true
      }
    ];

    const cards = await CreditCard.insertMany(
      creditCards.map(card => ({
        ...card,
        userId: user._id
      }))
    );
    console.log(`${cards.length} cartões criados`);

    console.log('\n✅ Seed concluído com sucesso!');
    console.log('\n📋 Dados criados:');
    console.log(`👤 Usuário: ${user.email} (senha: senha123)`);
    console.log(`📂 Categorias: ${categories.length}`);
    console.log(`💳 Cartões: ${cards.length}`);
    
    console.log('\n🔑 Para fazer login, use:');
    console.log('Email: usuario@exemplo.com');
    console.log('Senha: senha123');

  } catch (error) {
    console.error('Erro ao executar seed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Conexão com MongoDB fechada');
  }
};

// Executar seed se chamado diretamente
if (require.main === module) {
  seedData();
}

export default seedData;
