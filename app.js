// 1. CONFIGURAÇÃO DA URL
const API_URL = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost' 
    ? 'http://localhost:5000' 
    : 'https://grupo-de-louvor-santa-esmeralda.onrender.com';

/**
 * 2. ELEMENTOS DO DOM
 */
const areaEditorLetra = document.getElementById('texto-letra');
const listaMusicasDiv = document.getElementById('lista-musicas');
const inputPesquisa = document.getElementById('input-pesquisa');
const contadorMusicas = document.getElementById('contador-musicas');
const chatDisplay = document.getElementById('chat-mensagens');
const chatInput = document.getElementById('chat-input');
const btnEnviarChat = document.getElementById('btn-enviar-chat');

// Novo elemento para Categoria (Certifique-se de ter um <select id="select-categoria"> no seu HTML)
const selectCategoria = document.getElementById('select-categoria');

// Elementos para os Links
const btnAddLink = document.getElementById('btn-add-link');
const inputLink = document.getElementById('link-referencia');
const listaLinksDinamica = document.getElementById('lista-links-dinamica');

let todasAsMusicas = []; 
let listaTemporariaLinks = []; 

/**
 * 3. LÓGICA DE MÚSICAS (CARREGAR E EXIBIR)
 */
function obterCorCategoria(categoria) {
    const cores = { 
        'Adoração': '#3498db', 
        'Celebração': '#f1c40f', 
        'Especial': '#9b59b6', 
        'Início': '#2ecc71',
        'Santa Ceia': '#e74c3c', // Cor para Santa Ceia
        'Missão': '#e67e22'      // Cor para Missão
    };
    return cores[categoria] || '#7f8c8d';
}

function renderizarLista(musicas) {
    if (contadorMusicas) contadorMusicas.innerText = musicas.length;
    if (!musicas.length) {
        listaMusicasDiv.innerHTML = '<p style="padding:10px;">Nenhuma música encontrada.</p>';
        return;
    }

    listaMusicasDiv.innerHTML = musicas.map(m => `
        <div class="item-musica" id="musica-${m._id}" style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #333;">
            <div onclick="exibirLetra('${m._id}')" style="cursor:pointer; flex-grow: 1;">
                <span style="font-size: 0.7rem; background: ${obterCorCategoria(m.categoria)}; color: white; padding: 2px 6px; border-radius: 4px; text-transform: uppercase;">
                    ${m.categoria || 'Geral'}
                </span><br>
                <strong style="color: #fff">${m.titulo}</strong><br>
                <small style="color: #ccc">${m.artista || 'Grupo Santa Esmeralda'}</small>
            </div>
            <button onclick="excluirMusica('${m._id}')" style="background:none; border:none; color: #ff4d4d; cursor:pointer; font-size: 1.2rem;">🗑️</button>
        </div>
    `).join('');
}

async function carregarMusicas() {
    try {
        const res = await fetch(`${API_URL}/musics`);
        todasAsMusicas = await res.json();
        renderizarLista(todasAsMusicas);
    } catch (err) { 
        console.error("Erro ao carregar músicas:", err); 
    }
}

window.exibirLetra = (id) => {
    const musica = todasAsMusicas.find(m => m._id === id);
    if (musica) {
        areaEditorLetra.value = musica.letra || "";
        if (selectCategoria) selectCategoria.value = musica.categoria || "Adoração";
        listaTemporariaLinks = musica.links || []; 
        renderizarLinks();

        document.querySelectorAll('.item-musica').forEach(i => i.classList.remove('selecionada'));
        document.getElementById(`musica-${id}`)?.classList.add('selecionada');
    }
};

window.excluirMusica = async (id) => {
    if (!confirm("Deseja realmente excluir este registro?")) return;
    try {
        await fetch(`${API_URL}/musics/${id}`, { method: 'DELETE' });
        carregarMusicas();
    } catch (err) { console.error("Erro ao excluir:", err); }
};

/**
 * 4. FUNÇÃO SALVAR TUDO (Título, Links, Categoria e Letra)
 */
async function salvarLetra() {
    const titulo = prompt("Digite o nome da música ou referência:");
    if (!titulo) return;

    const letra = areaEditorLetra.value.trim();
    const categoria = selectCategoria ? selectCategoria.value : "Adoração";

    const novaMusica = {
        titulo: titulo,
        artista: "Grupo Santa Esmeralda",
        categoria: categoria,
        letra: letra, // Pode ir vazio agora
        links: listaTemporariaLinks // Envia a lista azul de links
    };

    try {
        const res = await fetch(`${API_URL}/musics`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(novaMusica)
        });

        if (res.ok) {
            alert("Informações salvas com sucesso!");
            // Limpar campos
            areaEditorLetra.value = "";
            listaTemporariaLinks = []; 
            renderizarLinks();
            await carregarMusicas();
        }
    } catch (err) { 
        console.error("Erro ao salvar:", err); 
        alert("Erro ao conectar com o servidor.");
    }
}

/**
 * 5. LÓGICA DO CHAT E LINKS DINÂMICOS
 */
async function carregarMensagens() {
    try {
        const res = await fetch(`${API_URL}/messages`);
        const mensagens = await res.json();
        if (chatDisplay) {
            chatDisplay.innerHTML = mensagens.map(m => `
                <div style="margin-bottom: 10px; padding-bottom: 5px;">
                    <strong style="color: #00d1b2; font-size: 0.8rem;">${new Date(m.data).toLocaleTimeString()} - Membro:</strong>
                    <p style="margin: 5px 0; color: white;">${m.texto}</p>
                </div>
            `).join('');
            chatDisplay.scrollTop = chatDisplay.scrollHeight;
        }
    } catch (err) { console.error("Erro no chat:", err); }
}

async function enviarMensagem() {
    const texto = chatInput.value.trim();
    if (!texto) return;
    try {
        await fetch(`${API_URL}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ texto })
        });
        chatInput.value = '';
        carregarMensagens();
    } catch (err) { console.error("Erro ao enviar mensagem:", err); }
}

function renderizarLinks() {
    if (!listaLinksDinamica) return;
    listaLinksDinamica.innerHTML = listaTemporariaLinks.map((link, index) => `
        <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0,209,178,0.1); padding: 8px; border-radius: 5px; border-left: 4px solid #00d1b2; margin-bottom: 5px;">
            <a href="${link}" target="_blank" style="color: #00d1b2; text-decoration: none; font-size: 0.85rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 80%;">
                ${link}
            </a>
            <button onclick="removerLinkDaLista(${index})" style="background: none; border: none; color: #ff4d4d; cursor: pointer; font-size: 1.2rem;">🗑️</button>
        </div>
    `).join('');
}

window.removerLinkDaLista = (index) => {
    listaTemporariaLinks.splice(index, 1);
    renderizarLinks();
};

/**
 * 6. INICIALIZAÇÃO
 */
document.addEventListener('DOMContentLoaded', () => {
    carregarMusicas();
    carregarMensagens();
    setInterval(carregarMensagens, 8000); 

    btnAddLink?.addEventListener('click', () => {
        const url = inputLink.value.trim();
        if (url) {
            listaTemporariaLinks.push(url);
            renderizarLinks();
            inputLink.value = '';
        }
    });

    document.getElementById('btn-salvar-letra')?.addEventListener('click', salvarLetra);
    btnEnviarChat?.addEventListener('click', enviarMensagem);
    
    chatInput?.addEventListener('keypress', (e) => { 
        if (e.key === 'Enter') enviarMensagem(); 
    });

    inputPesquisa?.addEventListener('input', (e) => {
        const termo = e.target.value.toLowerCase();
        const filtradas = todasAsMusicas.filter(m => m.titulo.toLowerCase().includes(termo));
        renderizarLista(filtradas);
    });

    document.getElementById('btn-limpar-editor')?.addEventListener('click', () => {
        areaEditorLetra.value = "";
        listaTemporariaLinks = [];
        renderizarLinks();
    });
});
