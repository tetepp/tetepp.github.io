// Configuração do Firebase (substitua com seus dados)
const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_PROJETO.firebaseapp.com",
  databaseURL: "https://SEU_PROJETO.firebaseio.com",
  projectId: "SEU_PROJETO",
  storageBucket: "SEU_PROJETO.appspot.com",
  messagingSenderId: "SEU_SENDER_ID",
  appId: "SEU_APP_ID"
};

// Inicialize o Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

let estoque = [];
let editandoId = null;

// Carregar estoque do Firebase
async function carregarEstoque() {
  try {
    const snapshot = await database.ref('sapatos').once('value');
    estoque = snapshot.val() ? Object.values(snapshot.val()) : [];
    console.log("Estoque carregado:", estoque);
    atualizarListaEstoque();
  } catch (error) {
    console.error("Erro ao carregar estoque:", error);
  }
}

// Salvar sapato no Firebase
async function salvarSapato(sapato) {
  try {
    await database.ref(`sapatos/${sapato.id}`).set(sapato);
    console.log("Sapato salvo:", sapato.id);
  } catch (error) {
    console.error("Erro ao salvar sapato:", error);
    throw error;
  }
}

// Remover sapato do Firebase
async function removerSapatoDB(id) {
  try {
    await database.ref(`sapatos/${id}`).remove();
    console.log("Sapato removido:", id);
  } catch (error) {
    console.error("Erro ao remover sapato:", error);
    throw error;
  }
}

function gerarIdUnico() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function validarFormulario() {
    let valido = true;
    const modelo = document.getElementById('modelo').value;
    const cor = document.getElementById('cor').value;
    const numeracao = document.getElementById('numeracao').value;
    const valor = document.getElementById('valor').value;
    
    // Limpar erros anteriores
    document.querySelectorAll('.error').forEach(el => el.textContent = '');
    
    if (!modelo) {
        document.getElementById('modelo-error').textContent = 'Modelo é obrigatório';
        valido = false;
    }
    
    if (!cor) {
        document.getElementById('cor-error').textContent = 'Cor é obrigatória';
        valido = false;
    }
    
    if (!numeracao) {
        document.getElementById('numeracao-error').textContent = 'Numeração é obrigatória';
        valido = false;
    }
    
    if (!valor || isNaN(valor) || parseFloat(valor) <= 0) {
        document.getElementById('valor-error').textContent = 'Valor inválido';
        valido = false;
    }
    
    const fileInput = document.getElementById('foto-upload');
    const sapatoExistente = estoque.find(s => s.id === editandoId);
    if (!fileInput.files || !fileInput.files[0]) {
        if (!sapatoExistente || !sapatoExistente.foto) {
            document.getElementById('foto-error').textContent = 'Foto é obrigatória';
            valido = false;
        }
    }

    return valido;
}

async function processarFoto() {
    const fileInput = document.getElementById('foto-upload');
    if (fileInput.files && fileInput.files[0]) {
        return await lerArquivoComoBase64(fileInput.files[0]);
    }
    
    return editandoId ? null : 'https://via.placeholder.com/200?text=Sapato+sem+imagem';
}


function lerArquivoComoBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}

async function adicionarSapato() {
  if (!validarFormulario()) return;

  const sapato = {
    id: editandoId || gerarIdUnico(),
    modelo: document.getElementById('modelo').value,
    cor: document.getElementById('cor').value,
    numeracao: document.getElementById('numeracao').value,
    valor: parseFloat(document.getElementById('valor').value),
    quantidade: parseInt(document.getElementById('quantidade').value),
    foto: await processarFoto(),
    dataCadastro: new Date().toLocaleString()
  };

  try {
    await salvarSapato(sapato);
    await carregarEstoque();
    limparFormulario();
    mostrarMensagemSucesso("Produto salvo com sucesso!");
  } catch (error) {
    console.error("Erro ao salvar sapato:", error);
    alert('Erro ao salvar sapato. Veja o console para detalhes.');
  }
}

// Atualizar lista de estoque (já adaptada para Firebase)
function atualizarListaEstoque(estoqueFiltrado = null) {
  const listaSapatos = document.getElementById('listaSapatos');
  const totalItens = document.getElementById('total-itens');
  
  listaSapatos.innerHTML = '';
  const itens = estoqueFiltrado || estoque;
  totalItens.textContent = itens.length;

  if (itens.length === 0) {
    listaSapatos.innerHTML = '<div class="col-12"><p class="text-center py-4">Nenhum sapato encontrado.</p></div>';
    return;
  }

    itensParaExibir.forEach(sapato => {
        const foto = sapato.foto || "https://via.placeholder.com/200?text=Sapato+sem+imagem";
        const modelo = sapato.modelo || "Modelo desconhecido";
        const valor = sapato.valor ? sapato.valor.toFixed(2) : "0.00";
        const quantidade = sapato.quantidade || "0";
        const data = sapato.dataCadastro || "Data desconhecida";
        
        const sapatoCard = document.createElement('div');
        sapatoCard.className = 'col-md-2 mb-4';
        sapatoCard.innerHTML = `
            <div class="card h-100" style="width: 250px; padding: 1rem;">
                <img src="${foto}" class="card-img-top" alt="${modelo}" style="height: 150px; object-fit: cover;">
                <div class="card-body">
                    <h5 class="card-title"><strong>${modelo}</strong></h5>
                    <p class="card-text" style="margin-bottom: 0px"><strong>COR:</strong> ${sapato.cor || "Não informada"}</p>
                    <p class="card-text" style="margin-bottom: 0px"><strong>NUMERAÇÃO:</strong> ${sapato.numeracao || "N/I"}</p>
                    <p class="card-text" style="margin-bottom: 0px"><strong>VALOR:</strong> R$ ${valor}</p>
                    <p class="card-text"><strong>QUANTIDADE:</strong> 
                        ${quantidade == 0 
                            ? '<span style="color:red;">Produto ESGOTADO</span>' 
                            : quantidade}
                    </p>
                    <p class="card-text"><small class="text-muted">Cadastrado em: ${data}</small></p>
                </div>
                <div class="card-footer bg-white" style="padding: 0.75rem; margin-top: auto;">
                    <div style="display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap;">
                        <button class="btn btn-outline-primary" 
                            style="padding: 0.375rem 0.75rem; font-size: 15px; flex: 1; min-width: 60px;"
                            data-id="${sapato.id}" id="btn-editar" onclick="editarSapato('${sapato.id}')">Editar</button>
                        <button class="btn btn-outline-danger"
                            style="padding: 0.375rem 0.75rem; font-size: 15px; flex: 1; min-width: 60px;"
                            onclick="removerSapato('${sapato.id}')">Excluir</button>
                        <button class="btn btn-outline-success"
                            style="padding: 0.375rem 0.75rem; font-size: 15px; flex: 1; min-width: 60px;"
                            onclick="venderProduto('${sapato.id}')">Venda</button>
                    </div>
                </div>
            </div>
        `;
        listaSapatos.appendChild(sapatoCard);
    });
}

// Exportar estoque
async function exportarEstoque() {
  await carregarEstoque();
  const dataStr = JSON.stringify(estoque, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', `estoque-sapatos-${new Date().toISOString().slice(0,10)}.json`);
  linkElement.click();
}

// Importar estoque
async function confirmarImportacao(file) {
  const reader = new FileReader();
  reader.onload = async function(e) {
    try {
      const novoEstoque = JSON.parse(e.target.result);
      if (!Array.isArray(novoEstoque)) throw new Error('Formato inválido');
      
      // Remove todos os sapatos existentes
      await database.ref('sapatos').remove();
      
      // Adiciona os novos
      const updates = {};
      novoEstoque.forEach(sapato => {
        updates[`/sapatos/${sapato.id}`] = sapato;
      });
      
      await database.ref().update(updates);
      await carregarEstoque();
      alert('Estoque importado com sucesso!');
    } catch (error) {
      alert('Erro ao importar estoque: ' + error.message);
      console.error(error);
    }
  };
  reader.readAsText(file);
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      carregarEstoque();
    } else {
      window.location.href = 'login.html';
    }
  });
});

function editarSapato(id) {
    const sapato = estoque.find(s => s.id === id);
    if (!sapato) return;
    
    editandoId = id;
    
    document.getElementById('modelo').value = sapato.modelo;
    document.getElementById('cor').value = sapato.cor;
    document.getElementById('numeracao').value = sapato.numeracao;
    document.getElementById('valor').value = sapato.valor;
    document.getElementById('quantidade').value = sapato.quantidade;
    
 
    document.getElementById('btn-adicionar').textContent = 'Salvar Alterações';
    document.getElementById('btn-cancelar').textContent = 'Cancelar Alterações';
    
    document.querySelector('#cadastro-produtos').scrollIntoView({ behavior: 'smooth' });
}

function limparFormulario() {
    document.getElementById('modelo').value = '';
    document.getElementById('cor').value = '';
    document.getElementById('numeracao').value = '';
    document.getElementById('valor').value = '';
    document.getElementById('quantidade').value = '';
    document.getElementById('foto-upload').value = '';
    
    document.getElementById('modelo-error').textContent = '';
    document.getElementById('cor-error').textContent = '';
    document.getElementById('numeracao-error').textContent = '';
    document.getElementById('valor-error').textContent = '';
    document.getElementById('foto-error').textContent = '';
    
    if (editandoId) {
        document.getElementById('btn-adicionar').textContent = 'Cadastrar Produto';
        editandoId = null;
    }
}

// Abrir modal de confirmação
function abrirModal(mensagem, action, params = null) {
    modalAction = action;
    modalParams = params;
    document.getElementById('modal-message').textContent = mensagem;
    document.getElementById('confirm-modal').style.display = 'block';
}

function fecharModal() {
    document.getElementById('confirm-modal').style.display = 'none';
    modalAction = null;
    modalParams = null;
}


function confirmarAcao() {
    if (modalAction) {
        modalAction(modalParams);
    }
    fecharModal();
}

function removerSapato(id) {
    abrirModal('Tem certeza que deseja remover este sapato do estoque?', confirmarRemocao, id);
}

function venderProduto(id) {
    const index = estoque.findIndex(sapato => sapato.id === id);
    if (index !== -1) {
        let sapato = estoque[index];
        let quantidadeAtual = parseInt(sapato.quantidade || 0);

        if (quantidadeAtual > 0) {
            sapato.quantidade = quantidadeAtual - 1;
            salvarSapato(sapato)
                .then(() => carregarEstoque())
                .then(() => atualizarListaEstoque())
                .catch(error => console.error("Erro ao vender produto:", error));
        }

        if (sapato.quantidade == 0) {
            alert(`Produto "${sapato.modelo}" está ESGOTADO!`);
        }
    }
}

function confirmarRemocao(id) {
    removerSapatoDB(id)
        .then(() => carregarEstoque())
        .then(() => atualizarListaEstoque())
        .catch(error => console.error("Erro ao remover sapato:", error));
}

function limparFiltros() {
    document.getElementById('filtro-modelo').value = '';
    document.getElementById('filtro-cor').value = '';
    document.getElementById('filtro-numeracao').value = '';
    atualizarListaEstoque();
}

function filtrarEstoque() {
    const filtroModelo = document.getElementById('filtro-modelo').value.toLowerCase();
    const filtroCor = document.getElementById('filtro-cor').value.toLowerCase();
    const filtroNumeracao = document.getElementById('filtro-numeracao').value;
    
    // Filtra os itens do array estoque (já carregado)
    const estoqueFiltrado = estoque.filter(sapato => {
        const modeloMatch = sapato.modelo?.toLowerCase().includes(filtroModelo) ?? false;
        const corMatch = sapato.cor?.toLowerCase().includes(filtroCor) ?? false;
        const numeracaoMatch = filtroNumeracao ? sapato.numeracao?.toString() === filtroNumeracao : true;
        
        return modeloMatch && corMatch && numeracaoMatch;
    });
    
    atualizarListaEstoque(estoqueFiltrado);
}

function importarEstoque(input) {
    const file = input.files[0];
    if (!file) return;
    
    abrirModal('Importar estoque substituirá todos os dados atuais. Continuar?', confirmarImportacao, file);
    
    input.value = '';
}
