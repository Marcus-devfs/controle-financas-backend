import mongoose from 'mongoose';
import Transaction from '../models/Transaction';
import Category from '../models/Category';
import { config } from 'dotenv';
import connectDB from '../config/database';

// Carregar variáveis de ambiente
config();

async function findAndFixCorruptedTransactions() {
  try {
    // Conectar ao MongoDB usando a mesma conexão da aplicação
    await connectDB();
    console.log('Conectado ao MongoDB');

    // 1. Encontrar transações com categoryId incorreto (string com código JS ao invés de ObjectId)
    console.log('\n=== Buscando transações com categoryId incorreto ===');
    
    // Buscar TODAS as transações
    const allTransactions = await Transaction.find({}).lean();
    
    // Filtrar transações onde categoryId é uma string que contém "new ObjectId" ou "_id:"
    const corruptedTransactions = allTransactions.filter(tx => {
      const catId = tx.categoryId as any;
      
      // Se é string e contém o padrão de objeto JavaScript
      if (typeof catId === 'string') {
        return catId.includes('new ObjectId') || catId.includes('_id:') || catId.includes('\n');
      }
      
      // Se é objeto com propriedades (caso esteja realmente como objeto)
      if (catId && typeof catId === 'object' && !catId.toString) {
        return '_id' in catId || 'name' in catId;
      }
      
      return false;
    });

    console.log(`Encontradas ${corruptedTransactions.length} transações com categoryId incorreto`);

    if (corruptedTransactions.length === 0) {
      console.log('Nenhuma transação corrompida encontrada!');
      await mongoose.disconnect();
      return;
    }

    // Mostrar algumas transações corrompidas
    console.log('\n=== Exemplos de transações corrompidas ===');
    corruptedTransactions.slice(0, 5).forEach((tx, index) => {
      console.log(`\n${index + 1}. ID: ${tx._id}`);
      console.log(`   Descrição: ${tx.description}`);
      console.log(`   categoryId tipo: ${typeof tx.categoryId}`);
      console.log(`   categoryId valor:`, JSON.stringify(tx.categoryId, null, 2));
    });

    // 2. Corrigir transações corrompidas
    console.log('\n=== Corrigindo transações ===');
    let fixed = 0;
    let deleted = 0;

    for (const tx of corruptedTransactions) {
      const categoryId = tx.categoryId as any;
      let correctCategoryId: string | null = null;
      
      // Caso 1: categoryId é uma string que contém código JavaScript
      if (typeof categoryId === 'string') {
        // Extrair o ObjectId da string usando regex
        // Procura por: new ObjectId('...') ou _id: new ObjectId('...') ou '_id': '...'
        const objectIdMatch = categoryId.match(/ObjectId\(['"]([0-9a-fA-F]{24})['"]\)/);
        if (objectIdMatch) {
          correctCategoryId = objectIdMatch[1];
        } else {
          // Tentar padrão alternativo: '_id': '...'
          const idMatch = categoryId.match(/['"]_id['"]:\s*['"]([0-9a-fA-F]{24})['"]/);
          if (idMatch) {
            correctCategoryId = idMatch[1];
          }
        }
      }
      // Caso 2: categoryId é um objeto com _id
      else if (categoryId && typeof categoryId === 'object' && categoryId._id) {
        // Pode ser ObjectId ou string
        if (typeof categoryId._id === 'object' && categoryId._id.toString) {
          correctCategoryId = categoryId._id.toString();
        } else {
          correctCategoryId = String(categoryId._id);
        }
      }
      
      if (correctCategoryId && /^[0-9a-fA-F]{24}$/.test(correctCategoryId)) {
        // Verificar se a categoria existe
        const categoryExists = await Category.findById(correctCategoryId);
        
        if (categoryExists) {
          // Atualizar a transação com o categoryId correto
          await Transaction.updateOne(
            { _id: tx._id },
            { $set: { categoryId: correctCategoryId } }
          );
          console.log(`✓ Corrigida transação ${tx._id.toString()}: categoryId = ${correctCategoryId}`);
          fixed++;
        } else {
          // Se a categoria não existe, deletar a transação
          await Transaction.deleteOne({ _id: tx._id });
          console.log(`✗ Deletada transação ${tx._id.toString()}: categoria não existe`);
          deleted++;
        }
      } else {
        // Se não conseguiu extrair um ObjectId válido, deletar
        await Transaction.deleteOne({ _id: tx._id });
        console.log(`✗ Deletada transação ${tx._id.toString()}: não foi possível extrair categoryId válido`);
        console.log(`   Valor original: ${typeof categoryId === 'string' ? categoryId.substring(0, 100) : JSON.stringify(categoryId)}`);
        deleted++;
      }
    }

    console.log(`\n=== Resumo ===`);
    console.log(`Total encontrado: ${corruptedTransactions.length}`);
    console.log(`Corrigidas: ${fixed}`);
    console.log(`Deletadas: ${deleted}`);

    await mongoose.disconnect();
    console.log('\nDesconectado do MongoDB');
  } catch (error) {
    console.error('Erro:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  findAndFixCorruptedTransactions();
}

export { findAndFixCorruptedTransactions };

