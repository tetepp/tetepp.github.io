// Variáveis globais
let estoque = [];
let sapatoEditando = null;
let confirmAction = null;
let currentFilters = {};

// Inicialização quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    verificarAutenticacao();
    carregarEstoque();
    configurarEventos();
});

// Verifica se o usuário está autenticado
function verificarAutenticacao() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        window.location.href = 'login.html';
    }
}

// Configura eventos do formulário
function configurarEventos() {
    // Evento para upload de foto
    document.getElementById('foto-upload').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                document.getElementById('foto-preview').src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    // Evento para pressionar Enter nos filtros
    document.getElementById('filtro-modelo').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') filtrarEstoque();
    });
    document.getElementById('filtro-cor').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') filtrarEstoque();
    });
}

// Carrega o estoque da API
async function carregarEstoque() {
    try {
        const response = await fetch('../api/produtos.php');
        if (!response.ok) throw new Error('Erro ao carregar estoque');
        
        estoque = await response.json();
        exibirProdutos(estoque);
        atualizarTotalItens(estoque);
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao carregar estoque', 'error');
    }
}

// Exibe os produtos na tela
function exibirProdutos(produtos) {
    const listaSapatos = document.getElementById('listaSapatos');
    listaSapatos.innerHTML = '';

    if (produtos.length === 0) {
        listaSapatos.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="alert alert-info">
                    Nenhum produto encontrado
                </div>
            </div>`;
        return;
    }

    produtos.forEach(sapato => {
        const card = document.createElement('div');
        card.className = 'col-md-4 col-lg-3 mb-4';
        card.innerHTML = `
            <div class="card h-100">
                <img src="${sapato.foto || 'https://via.placeholder.com/300'}" 
                     class="card-img-top" alt="${sapato.modelo}"
                     style="height: 200px; object-fit: cover;">
                <div class="card-body">
                    <h5 class="card-title">${sapato.modelo}</h5>
                    <p class="card-text">
                        <strong>Cor:</strong> ${sapato.cor}<br>
                        <strong>Numeração:</strong> ${sapato.numeracao}<br>
                        <strong>Valor:</strong> R$ ${parseFloat(sapato.valor).toFixed(2)}<br>
                        <strong>Quantidade:</strong> ${sapato.quantidade}
                    </p>
                </div>
                <div class="card-footer bg-white d-flex justify-content-between">
                    <button class="btn btn-warning btn-sm" onclick="editarSapato('${sapato.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="confirmarExclusao('${sapato.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>`;
        listaSapatos.appendChild(card);
    });
}

// Atualiza o contador total de itens
function atualizarTotalItens(produtos) {
    const total = produtos.reduce((sum, item) => sum + parseInt(item.quantidade), 0);
    document.getElementById('total-itens').textContent = total;
}

// Filtra o estoque
async function filtrarEstoque() {
    const modelo = document.getElementById('filtro-modelo').value;
    const cor = document.getElementById('filtro-cor').value;
    const numeracao = document.getElementById('filtro-numeracao').value;

    currentFilters = { modelo, cor, numeracao };

    try {
        const params = new URLSearchParams();
        if (modelo) params.append('modelo', modelo);
        if (cor) params.append('cor', cor);
        if (numeracao) params.append('numeracao', numeracao);

        const response = await fetch(`../api/produtos.php?${params.toString()}`);
        if (!response.ok) throw new Error('Erro ao filtrar estoque');
        
        const produtos = await response.json();
        exibirProdutos(produtos);
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao filtrar estoque', 'error');
    }
}

// Limpa os filtros
function limparFiltros() {
    document.getElementById('filtro-modelo').value = '';
    document.getElementById('filtro-cor').value = '';
    document.getElementById('filtro-numeracao').value = '';
    currentFilters = {};
    carregarEstoque();
}

// Adiciona ou atualiza um sapato
async function adicionarSapato() {
    if (!validarFormulario()) return;

    const formData = {
        modelo: document.getElementById('modelo').value,
        cor: document.getElementById('cor').value,
        numeracao: document.getElementById('numeracao').value,
        valor: parseFloat(document.getElementById('valor').value),
        quantidade: parseInt(document.getElementById('quantidade').value),
        foto: await uploadFoto()
    };

    const id = document.getElementById('sapato-id').value;
    const method = id ? 'PUT' : 'POST';
    const url = id ? `../api/produtos.php?id=${id}` : '../api/produtos.php';

    try {
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) throw new Error('Erro ao salvar produto');

        const data = await response.json();
        mostrarMensagemSucesso(id ? 'Produto atualizado com sucesso!' : 'Produto adicionado com sucesso!');
        limparFormulario();
        carregarEstoque();
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao salvar produto', 'error');
    }
}

// Faz upload da foto para o servidor
async function uploadFoto() {
    const fileInput = document.getElementById('foto-upload');
    if (!fileInput.files || fileInput.files.length === 0) {
        return sapatoEditando ? sapatoEditando.foto : '';
    }

    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append('foto', file);

    try {
        const response = await fetch('../api/upload.php', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) throw new Error('Erro no upload da foto');

        const data = await response.json();
        return data.filePath;
    } catch (error) {
        console.error('Erro no upload:', error);
        mostrarMensagem('Erro ao enviar foto', 'error');
        return '';
    }
}

// Valida o formulário antes de enviar
function validarFormulario() {
    let valido = true;
    const campos = ['modelo', 'cor', 'numeracao', 'valor'];

    campos.forEach(campo => {
        const elemento = document.getElementById(campo);
        const errorElement = document.getElementById(`${campo}-error`);
        
        if (!elemento.value) {
            errorElement.textContent = `Campo ${campo} é obrigatório`;
            valido = false;
        } else {
            errorElement.textContent = '';
        }
    });

    return valido;
}

// Preenche o formulário para edição
async function editarSapato(id) {
    try {
        const response = await fetch(`../api/produtos.php?id=${id}`);
        if (!response.ok) throw new Error('Erro ao carregar produto');
        
        sapatoEditando = await response.json();
        
        document.getElementById('sapato-id').value = sapatoEditando.id;
        document.getElementById('modelo').value = sapatoEditando.modelo;
        document.getElementById('cor').value = sapatoEditando.cor;
        document.getElementById('numeracao').value = sapatoEditando.numeracao;
        document.getElementById('valor').value = sapatoEditando.valor;
        document.getElementById('quantidade').value = sapatoEditando.quantidade;
        
        // Atualiza o preview da foto se existir
        if (sapatoEditando.foto) {
            document.getElementById('foto-preview').src = sapatoEditando.foto;
        }
        
        document.getElementById('btn-adicionar').textContent = 'Atualizar Produto';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao carregar produto para edição', 'error');
    }
}

// Confirma a exclusão de um produto
function confirmarExclusao(id) {
    const produto = estoque.find(p => p.id == id);
    if (!produto) return;

    document.getElementById('modal-message').textContent = 
        `Tem certeza que deseja excluir o produto ${produto.modelo} (${produto.cor}, Nº ${produto.numeracao})?`;
    
    confirmAction = async function() {
        try {
            const response = await fetch(`../api/produtos.php?id=${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Erro ao excluir produto');

            const data = await response.json();
            if (data.success) {
                mostrarMensagemSucesso('Produto excluído com sucesso!');
                carregarEstoque();
            } else {
                throw new Error('Falha ao excluir produto');
            }
        } catch (error) {
            console.error('Erro:', error);
            mostrarMensagem('Erro ao excluir produto', 'error');
        } finally {
            fecharModal();
        }
    };

    abrirModal();
}

// Exporta o estoque para JSON
async function exportarEstoque() {
    try {
        const response = await fetch('../api/produtos.php');
        if (!response.ok) throw new Error('Erro ao exportar estoque');
        
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup-estoque-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        mostrarMensagemSucesso('Estoque exportado com sucesso!');
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao exportar estoque', 'error');
    }
}

// Importa estoque de um arquivo JSON
function importarEstoque(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const produtos = JSON.parse(e.target.result);
            if (!Array.isArray(produtos)) throw new Error('Formato inválido');
            
            // Confirmação antes de importar
            document.getElementById('modal-message').textContent = 
                `Deseja importar ${produtos.length} produtos? Isso substituirá o estoque atual.`;
            
            confirmAction = async function() {
                try {
                    const response = await fetch('../api/importar.php', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(produtos)
                    });

                    if (!response.ok) throw new Error('Erro ao importar estoque');

                    const data = await response.json();
                    mostrarMensagemSucesso('Estoque importado com sucesso!');
                    carregarEstoque();
                } catch (error) {
                    console.error('Erro:', error);
                    mostrarMensagem('Erro ao importar estoque', 'error');
                } finally {
                    fecharModal();
                    input.value = ''; // Limpa o input de arquivo
                }
            };

            abrirModal();
        } catch (error) {
            console.error('Erro:', error);
            mostrarMensagem('Erro ao ler arquivo de estoque', 'error');
            input.value = ''; // Limpa o input de arquivo
        }
    };
    reader.readAsText(file);
}

// Limpa o formulário
function limparFormulario() {
    document.getElementById('sapato-id').value = '';
    document.getElementById('modelo').value = '';
    document.getElementById('cor').value = '';
    document.getElementById('numeracao').value = '';
    document.getElementById('valor').value = '';
    document.getElementById('quantidade').value = '0';
    document.getElementById('foto-upload').value = '';
    document.getElementById('foto-preview').src = '';
    
    // Limpa mensagens de erro
    document.querySelectorAll('.error').forEach(el => {
        el.textContent = '';
    });
    
    document.getElementById('btn-adicionar').textContent = 'Cadastrar Produto';
    sapatoEditando = null;
}

// Funções do modal de confirmação
function abrirModal() {
    document.getElementById('confirm-modal').style.display = 'block';
}

function fecharModal() {
    document.getElementById('confirm-modal').style.display = 'none';
    confirmAction = null;
}

function confirmarAcao() {
    if (confirmAction) {
        confirmAction();
    }
}

// Mostra mensagem de sucesso
function mostrarMensagemSucesso(mensagem) {
    const elemento = document.getElementById('mensagem-sucesso');
    elemento.textContent = mensagem;
    elemento.classList.remove('hidden');
    
    setTimeout(() => {
        elemento.classList.add('hidden');
    }, 3000);
}

// Mostra mensagem de erro
function mostrarMensagem(mensagem, tipo = 'error') {
    alert(`${tipo.toUpperCase()}: ${mensagem}`);
}