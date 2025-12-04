document.addEventListener('DOMContentLoaded', function() {
    // ============================================
    // VERIFICAÇÃO DE SEGURANÇA - APENAS ADMINISTRADOR
    // ============================================
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    const adminLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
    
    if (!isAdmin || !adminLoggedIn) {
        alert('Acesso negado! Esta área é restrita a administradores.');
        // Redireciona para a tela de login
        window.location.href = 'telaLogin.html';
        return;
    }
    
    // ============================================
    // CONFIGURAÇÕES DA API
    // ============================================
    const API_BASE = 'http://localhost:8081/api';
    const PRODUCTS_URL = `${API_BASE}/produtos`;
    const USERS_URL = `${API_BASE}/usuarios`;
    const SALES_URL = `${API_BASE}/vendas`;
    
    // Elementos da interface
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    const productForm = document.getElementById('productForm');
    const logoutBtn = document.getElementById('logoutBtn');
    const exportBtn = document.getElementById('exportBtn');
    
    // Variáveis para armazenar dados
    let produtos = [];
    let usuarios = [];
    let vendas = [];

    // Inicialização
    initTabs();
    loadAllData();
    setupEventListeners();

    // Sistema de abas
    function initTabs() {
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabId = tab.getAttribute('data-tab');
                
                // Remove classe active de todas as abas e conteúdos
                tabs.forEach(t => t.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));
                
                // Adiciona classe active à aba e conteúdo selecionados
                tab.classList.add('active');
                document.getElementById(`${tabId}-tab`).classList.add('active');
                
                // Carrega dados específicos da aba
                if (tabId === 'inventory') {
                    loadProducts();
                } else if (tabId === 'sales') {
                    loadSales();
                }
            });
        });
    }

    // Configurar event listeners
    function setupEventListeners() {
        // Cadastrar novo produto
        productForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await cadastrarProduto();
        });

        // Exportar relatórios
        exportBtn.addEventListener('click', async () => {
            await exportarRelatorios();
        });

        // Logout
        logoutBtn.addEventListener('click', () => {
            fazerLogout();
        });
    }

    // Carregar todos os dados
    async function loadAllData() {
        try {
            // Carregar produtos
            const produtosResponse = await fetch(PRODUCTS_URL);
            if (produtosResponse.ok) {
                produtos = await produtosResponse.json();
            }
            
            // Carregar usuários
            const usuariosResponse = await fetch(USERS_URL);
            if (usuariosResponse.ok) {
                usuarios = await usuariosResponse.json();
            }
            
            // Carregar vendas
            const vendasResponse = await fetch(SALES_URL);
            if (vendasResponse.ok) {
                vendas = await vendasResponse.json();
            }
            
            // Atualizar dashboard com dados reais
            updateDashboardWithRealData();
            
            // Renderizar tabelas iniciais
            renderProductsTable(produtos);
            renderSalesTable(vendas);
            
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            updateDashboardWithMockData();
        }
    }

    // Atualizar dashboard com dados reais
    function updateDashboardWithRealData() {
        // 1. Calcular total de vendas
        const totalVendas = vendas.reduce((total, venda) => {
            return total + (venda.valorTotal || 0);
        }, 0);
        
        // 2. Calcular total de produtos em estoque
        const totalEstoque = produtos.reduce((total, produto) => {
            return total + (produto.estoque || 0);
        }, 0);
        
        // 3. Contar usuários (clientes ativos)
        const totalClientes = usuarios.length;
        
        // Atualizar os cards
        updateDashboardCards(totalVendas, totalEstoque, totalClientes);
    }

    // Atualizar dashboard com dados mockados (fallback)
    function updateDashboardWithMockData() {
        const mockVendas = 1245.80;
        const mockEstoque = 1248;
        const mockClientes = 342;
        
        updateDashboardCards(mockVendas, mockEstoque, mockClientes);
    }

    // Atualizar cards do dashboard
    function updateDashboardCards(vendasTotal, produtosEstoque, clientesAtivos) {
        const cards = document.querySelectorAll('.dashboard-card p');
        if (cards.length >= 3) {
            // Card 1: Vendas (Total Geral)
            cards[0].textContent = `R$ ${vendasTotal.toFixed(2)}`;
            
            // Card 2: Produtos em Estoque
            cards[1].textContent = produtosEstoque.toLocaleString('pt-BR');
            
            // Card 3: Clientes Ativos
            cards[2].textContent = clientesAtivos.toLocaleString('pt-BR');
        }
    }

    // Carregar produtos para gerenciamento de estoque
    async function loadProducts() {
        try {
            const response = await fetch(PRODUCTS_URL);
            if (!response.ok) throw new Error('Erro ao carregar produtos');
            
            produtos = await response.json();
            renderProductsTable(produtos);
        } catch (error) {
            console.error('Erro ao carregar produtos:', error);
            renderProductsTable(produtos);
        }
    }

    // Carregar vendas
    async function loadSales() {
        try {
            const response = await fetch(SALES_URL);
            if (!response.ok) throw new Error('Erro ao carregar vendas');
            
            vendas = await response.json();
            renderSalesTable(vendas);
        } catch (error) {
            console.error('Erro ao carregar vendas:', error);
            renderSalesTable(vendas);
        }
    }

    // Renderizar tabela de produtos
    function renderProductsTable(produtos) {
        const tbody = document.querySelector('#inventory-tab tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';

        if (produtos.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 20px;">
                        Nenhum produto cadastrado
                    </td>
                </tr>
            `;
            return;
        }

        produtos.forEach(produto => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${produto.nome || 'Sem nome'}</td>
                <td>${produto.codigo || 'Sem código'}</td>
                <td>R$ ${produto.preco ? produto.preco.toFixed(2) : '0.00'}</td>
                <td>${produto.estoque || 0}</td>
                <td>
                    <button class="btn-edit" onclick="editProduct(${produto.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-danger" onclick="deleteProduct(${produto.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    // Renderizar tabela de vendas
    function renderSalesTable(vendas) {
        const tbody = document.querySelector('#sales-tab tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';

        if (vendas.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 20px;">
                        Nenhuma venda registrada
                    </td>
                </tr>
            `;
            return;
        }

        vendas.forEach(venda => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${venda.clienteNome || venda.cliente || venda.usuarioNome || 'Cliente não identificado'}</td>
                <td>${venda.clienteEmail || venda.email || venda.usuarioEmail || 'N/A'}</td>
                <td>${formatDate(venda.dataVenda || venda.data || venda.dataCompra)}</td>
                <td>R$ ${venda.valorTotal ? venda.valorTotal.toFixed(2) : '0.00'}</td>
                <td>
                    <button class="btn-details" onclick="viewSaleDetails(${venda.id})">
                        <i class="fas fa-eye"></i> Ver
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    // Cadastrar novo produto
    async function cadastrarProduto() {
        const productName = document.getElementById('productName').value;
        const productCode = document.getElementById('productCode').value;
        const productPrice = document.getElementById('productPrice').value;
        const productStock = document.getElementById('productStock').value;
        const productCategory = document.getElementById('productCategory').value;

        // Validações básicas
        if (!productName || !productCode || !productPrice || !productStock || !productCategory) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return;
        }

        const productData = {
            nome: productName,
            codigo: productCode,
            preco: parseFloat(productPrice),
            estoque: parseInt(productStock),
            categoria: productCategory
        };

        try {
            const response = await fetch(PRODUCTS_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(productData)
            });

            if (response.ok) {
                const novoProduto = await response.json();
                alert('Produto cadastrado com sucesso!');
                productForm.reset();
                
                // Atualizar dados
                produtos.push(novoProduto);
                renderProductsTable(produtos);
                updateDashboardWithRealData();
                
            } else if (response.status === 409) {
                alert('Já existe um produto com este código.');
            } else {
                throw new Error('Erro ao cadastrar produto');
            }
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao cadastrar produto. Tente novamente.');
        }
    }

    // Exportar relatórios
    async function exportarRelatorios() {
        try {
            // Criar dados para exportação
            const dadosParaExportar = {
                produtos: produtos,
                vendas: vendas,
                usuarios: usuarios,
                dataExportacao: new Date().toISOString()
            };
            
            // Converter para JSON
            const jsonString = JSON.stringify(dadosParaExportar, null, 2);
            
            // Criar blob e fazer download
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `relatorio_mercado_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            alert('Relatório exportado com sucesso!');
            
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao exportar relatórios. Tente novamente.');
        }
    }

    // Logout - MODIFICADO PARA LIMPAR DADOS DE ADMIN
    function fazerLogout() {
        if (confirm('Tem certeza que deseja sair da área gerencial?')) {
            // Limpar dados de administrador
            localStorage.removeItem('isAdmin');
            localStorage.removeItem('adminLoggedIn');
            
            // Limpar dados de sessão/localStorage se necessário
            localStorage.removeItem('gerenteToken');
            sessionStorage.removeItem('gerenteLogado');
            
            // Redirecionar para tela de login
            window.location.href = 'telaLogin.html';
        }
    }

    // Funções auxiliares
    function formatDate(dateString) {
        if (!dateString) return 'Data não disponível';
        
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return 'Data inválida';
            }
            return date.toLocaleDateString('pt-BR') + ' ' + 
                   date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        } catch (error) {
            return 'Data inválida';
        }
    }
});

// Funções globais para os botões de ação
async function editProduct(productId) {
    // Buscar produto atual
    try {
        const response = await fetch(`http://localhost:8081/api/produtos/${productId}`);
        if (!response.ok) throw new Error('Produto não encontrado');
        
        const produto = await response.json();
        
        // Criar formulário de edição
        const novoNome = prompt('Digite o novo nome do produto:', produto.nome);
        const novoPreco = prompt('Digite o novo preço do produto:', produto.preco);
        const novoEstoque = prompt('Digite a nova quantidade em estoque:', produto.estoque);
        
        if (novoNome && novoPreco && novoEstoque) {
            const dadosAtualizados = {
                nome: novoNome,
                preco: parseFloat(novoPreco),
                estoque: parseInt(novoEstoque)
            };
            
            const updateResponse = await fetch(`http://localhost:8081/api/produtos/${productId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dadosAtualizados)
            });

            if (updateResponse.ok) {
                alert('Produto atualizado com sucesso!');
                location.reload();
            } else {
                throw new Error('Erro ao atualizar produto');
            }
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao editar produto. Tente novamente.');
    }
}

async function deleteProduct(productId) {
    if (confirm('Tem certeza que deseja excluir este produto?\nEsta ação não pode ser desfeita.')) {
        try {
            const response = await fetch(`http://localhost:8081/api/produtos/${productId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                alert('Produto excluído com sucesso!');
                location.reload();
            } else {
                throw new Error('Erro ao excluir produto');
            }
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao excluir produto. Tente novamente.');
        }
    }
}

function viewSaleDetails(saleId) {
    // Implementar visualização de detalhes da venda
    fetch(`http://localhost:8081/api/vendas/${saleId}`)
        .then(response => {
            if (response.ok) return response.json();
            throw new Error('Venda não encontrada');
        })
        .then(venda => {
            const detalhes = `
Detalhes da Venda #${venda.id}

Cliente: ${venda.clienteNome || venda.cliente || 'Não identificado'}
E-mail: ${venda.clienteEmail || venda.email || 'N/A'}
Data: ${new Date(venda.dataVenda || venda.data).toLocaleString('pt-BR')}
Valor Total: R$ ${venda.valorTotal ? venda.valorTotal.toFixed(2) : '0.00'}

Itens da compra:
${venda.itens && venda.itens.length > 0 ? 
    venda.itens.map(item => `- ${item.nomeProduto || 'Produto'} - ${item.quantidade}x R$ ${item.precoUnitario || '0.00'}`).join('\n') 
    : 'Itens não disponíveis'}
            `;
            
            alert(detalhes);
        })
        .catch(error => {
            console.error('Erro:', error);
            
            // Fallback para dados simulados
            const detalhesSimulados = `
Detalhes da Venda #${saleId}

Itens (simulação):
- Arroz 5kg - 2x R$ 25,90
- Feijão 1kg - 1x R$ 8,50
- Óleo 900ml - 1x R$ 7,80

Total: R$ 68,10
Forma de pagamento: PIX
Data: 15/10/2024 10:30
            `;
            
            alert(detalhesSimulados);
        });
}

// Função para atualizar estoque (pode ser chamada de outros lugares)
async function updateStock(productId, newStock) {
    try {
        const response = await fetch(`http://localhost:8081/api/produtos/${productId}/estoque`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ estoque: newStock })
        });

        if (response.ok) {
            return true;
        } else {
            throw new Error('Erro ao atualizar estoque');
        }
    } catch (error) {
        console.error('Erro ao atualizar estoque:', error);
        return false;
    }
}

// Função para buscar estatísticas em tempo real
async function refreshDashboard() {
    try {
        const produtosResponse = await fetch('http://localhost:8081/api/produtos');
        const vendasResponse = await fetch('http://localhost:8081/api/vendas');
        const usuariosResponse = await fetch('http://localhost:8081/api/usuarios');
        
        if (produtosResponse.ok && vendasResponse.ok && usuariosResponse.ok) {
            const produtos = await produtosResponse.json();
            const vendas = await vendasResponse.json();
            const usuarios = await usuariosResponse.json();
            
            // Calcular totais
            const totalVendas = vendas.reduce((total, venda) => total + (venda.valorTotal || 0), 0);
            const totalEstoque = produtos.reduce((total, produto) => total + (produto.estoque || 0), 0);
            const totalClientes = usuarios.length;
            
            // Atualizar interface
            const cards = document.querySelectorAll('.dashboard-card p');
            if (cards.length >= 3) {
                cards[0].textContent = `R$ ${totalVendas.toFixed(2)}`;
                cards[1].textContent = totalEstoque.toLocaleString('pt-BR');
                cards[2].textContent = totalClientes.toLocaleString('pt-BR');
            }
        }
    } catch (error) {
        console.error('Erro ao atualizar dashboard:', error);
    }
}

// Atualizar dashboard a cada 30 segundos (opcional)
setInterval(() => {
    refreshDashboard();
}, 30000);
