/*--DIA [03/12/2025]|NOME:[Alex]|HORA INICIO: [13:00] HORA FINAL DO DIA:[HORA] --*/
document.addEventListener('DOMContentLoaded', function() {
    console.log('Página de pagamento carregada');
    

    const orderItemsContainer = document.querySelector('.order-items');
    const orderTotalElement = document.getElementById('orderTotal');
    const orderInfoElement = document.querySelector('.order-info');
    
    // Tentar carregar os dados do pedido
    loadOrderData();
    
    function loadOrderData() {
        // 1. Tentar pegar os dados do localStorage
        const savedOrder = localStorage.getItem('currentOrder');
        
        // 2. Verificar se existem dados
        if (!savedOrder) {
            console.warn('Nenhum pedido encontrado no localStorage');
            showEmptyOrderMessage();
            return;
        }
        
        try {
            // 3. Converter de volta para objeto JavaScript
            const orderData = JSON.parse(savedOrder);
            console.log('Pedido carregado:', orderData);
            
            // 4. Verificar se o carrinho tem itens
            if (!orderData.cart || orderData.cart.length === 0) {
                showEmptyOrderMessage();
                return;
            }
            
            // 5. Exibir os itens do pedido
            displayOrderItems(orderData.cart);
            
            // 6. Atualizar o total
            updateOrderTotal(orderData.total);
            
            // 7. Atualizar informações do pedido
            updateOrderInfo(orderData);
            
        } catch (error) {
            console.error('Erro ao carregar dados do pedido:', error);
            showEmptyOrderMessage();
        }
    }
    
    function displayOrderItems(cartItems) {
        // Limpar o container (remover os dados estáticos)
        orderItemsContainer.innerHTML = '';
        
        // Para cada item no carrinho, criar um elemento HTML
        cartItems.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'order-item';
            
            // Calcular subtotal do item
            const subtotal = item.price * item.quantity;
            
            itemElement.innerHTML = `
                <div class="item-details">
                    <div class="item-name">${item.name}</div>
                    <div class="item-quantity-price">
                        <span>${item.quantity} ${item.quantity > 1 ? 'unidades' : 'unidade'}</span>
                        <span>R$ ${item.price.toFixed(2).replace('.', ',')} cada</span>
                    </div>
                </div>
            `;
            
            orderItemsContainer.appendChild(itemElement);
        });
    }
    
    function updateOrderTotal(total) {
        // Formatar o número para exibir com vírgula
        orderTotalElement.textContent = total.toFixed(2).replace('.', ',');
    }
    
    function updateOrderInfo(orderData) {
        // Usar a data do pedido ou criar uma nova
        const orderDate = orderData.date || new Date().toLocaleString('pt-BR');
        
        orderInfoElement.innerHTML = `
            <p><i class="fas fa-store"></i> <strong>Mercado Autônomo</strong></p>
            <p><i class="fas fa-clock"></i> Data: ${orderDate}</p>
            <p><i class="fas fa-barcode"></i> Nº do Pedido: ${orderData.orderId || '#123456'}</p>
        `;
    }
    
    function showEmptyOrderMessage() {
        orderItemsContainer.innerHTML = `
            <div class="empty-order">
                <i class="fas fa-shopping-cart"></i>
                <p>Nenhum pedido encontrado</p>
                <p>Volte ao carrinho para adicionar produtos</p>
            </div>
        `;
        orderTotalElement.textContent = '0,00';
    }
});