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

let todasAsMusicas = []; 

/**
 * 3. LÓGICA DE MÚSICAS (CARREGAR E EXIBIR)
 */
function obterCorCategoria(categoria) {
    const cores = { 'Adoração': '#3498db', 'Celebração': '#f1c40f', 'Especial': '#9b59b6', 'Início': '#2ecc71' };
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
                <small style="color: #ccc">${m.artista}</small>
            </div>
            <button onclick="excluirMusica('${m._id}')" style="background:none; border:none; color: #ff4d4d; cursor:pointer; font-size: 1.2rem;">🗑️</button>
        </div>
    `).join('');
}

async function carregarMusicas() {
    try {
        console.log("Tentando carregar músicas de:", `${API_URL}/musics`);
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
        areaEditorLetra.value = musica.letra;
        document.querySelectorAll('.item-musica').forEach(i => i.classList.remove('selecionada'));
        document.getElementById(`musica-${id}`)?.classList.add('selecionada');
    }
};

window.excluirMusica = async (id) => {
    if (!confirm("Deseja realmente excluir esta música?")) return;
    try {
        await fetch(`${API_URL}/musics/${id}`, { method: 'DELETE' });
        carregarMusicas();
    } catch (err) { console.error("Erro ao excluir:", err); }
};

/**
 * 4. FUNÇÃO SALVAR (O CORAÇÃO DO SISTEMA)
 */
async function salvarLetra() {
    console.log(">>> Botão Salvar foi clicado!"); // Confirmação de clique no console
    const letra = areaEditorLetra.value.trim();
    
    if (!letra) {
        alert("Por favor, digite uma letra antes de salvar!");
        return;
    }

    const novaMusica = {
        titulo: "Música salva em " + new Date().toLocaleTimeString(),
        artista: "Grupo Santa Esmeralda",
        categoria: "Adoração",
        letra: letra
    };

    try {
        console.log("Enviando POST para:", `${API_URL}/musics`);
        const res = await fetch(`${API_URL}/musics`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(novaMusica)
        });

        if (res.ok) {
            console.log("✅ Salvo com sucesso no servidor!");
            alert("Música salva com sucesso!");
            areaEditorLetra.value = "";
            await carregarMusicas();
        } else {
            const erroTxt = await res.text();
            console.error("❌ O servidor recusou o salvamento:", erroTxt);
            alert("Erro no servidor ao salvar.");
        }
    } catch (err) {
        console.error("❌ Erro de conexão (O site não alcançou o servidor):", err);
        alert("Erro de conexão com o servidor.");
    }
}

/**
 * 5. LÓGICA DO CHAT
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

/**
 * 6. INICIALIZAÇÃO E EVENTOS
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 Scripts inicializados com sucesso!");
    carregarMusicas();
    carregarMensagens();
    setInterval(carregarMensagens, 5000); 

    // Conectar botões com verificação de segurança
    const btnSalvar = document.getElementById('btn-salvar-letra');
    if (btnSalvar) {
        console.log("✅ Botão de salvar encontrado e vinculado.");
        btnSalvar.addEventListener('click', salvarLetra);
    } else {
        console.error("❌ ERRO CRÍTICO: O botão 'btn-salvar-letra' não existe no seu HTML!");
    }

    btnEnviarChat?.addEventListener('click', enviarMensagem);
    
    chatInput?.addEventListener('keypress', (e) => { 
        if (e.key === 'Enter') enviarMensagem(); 
    });

    inputPesquisa?.addEventListener('input', (e) => {
        const termo = e.target.value.toLowerCase();
        const filtradas = todasAsMusicas.filter(m => m.titulo.toLowerCase().includes(termo));
        renderizarLista(filtradas);
    });

    // Limpar editor
    document.getElementById('btn-limpar-editor')?.addEventListener('click', () => {
        areaEditorLetra.value = "";
    });
});