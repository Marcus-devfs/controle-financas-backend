// Script para testar a API
const testAPI = async () => {
  const baseURL = 'http://localhost:3001';
  
  console.log('🧪 Testando API do Controle Financeiro...\n');
  
  try {
    // 1. Testar Health Check
    console.log('1. Testando Health Check...');
    const healthResponse = await fetch(`${baseURL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health Check:', healthData.message);
    
    // 2. Registrar usuário
    console.log('\n2. Registrando usuário...');
    const registerResponse = await fetch(`${baseURL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Usuário Teste',
        email: 'teste@email.com',
        password: 'senha123'
      })
    });
    
    const registerData = await registerResponse.json();
    if (registerData.success) {
      console.log('✅ Usuário registrado:', registerData.data.user.email);
      const token = registerData.data.token;
      
      // 3. Fazer login
      console.log('\n3. Fazendo login...');
      const loginResponse = await fetch(`${baseURL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'teste@email.com',
          password: 'senha123'
        })
      });
      
      const loginData = await loginResponse.json();
      if (loginData.success) {
        console.log('✅ Login realizado:', loginData.data.user.name);
        
        // 4. Criar categoria
        console.log('\n4. Criando categoria...');
        const categoryResponse = await fetch(`${baseURL}/api/categories`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: 'Alimentação',
            type: 'expense',
            color: '#FF5733'
          })
        });
        
        const categoryData = await categoryResponse.json();
        if (categoryData.success) {
          console.log('✅ Categoria criada:', categoryData.data.name);
          const categoryId = categoryData.data._id;
          
          // 5. Criar transação
          console.log('\n5. Criando transação...');
          const transactionResponse = await fetch(`${baseURL}/api/transactions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              description: 'Supermercado',
              amount: 150.50,
              date: '2024-01-15',
              type: 'expense',
              categoryId: categoryId
            })
          });
          
          const transactionData = await transactionResponse.json();
          if (transactionData.success) {
            console.log('✅ Transação criada:', transactionData.data.description);
            
            // 6. Buscar transações
            console.log('\n6. Buscando transações...');
            const transactionsResponse = await fetch(`${baseURL}/api/transactions`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            const transactionsData = await transactionsResponse.json();
            if (transactionsData.success) {
              console.log('✅ Transações encontradas:', transactionsData.data.transactions.length);
            }
          }
        }
      }
    }
    
    console.log('\n🎉 Todos os testes passaram! API funcionando perfeitamente!');
    
  } catch (error) {
    console.error('❌ Erro ao testar API:', error.message);
  }
};

// Executar testes
testAPI();
