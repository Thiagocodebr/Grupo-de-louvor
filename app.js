// 1. CONFIGURAÇÃO DA URL (AJUSTADO)
const API_URL = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost' 
    ? 'http://localhost:5000' 
    : 'https://seu-servidor-no-render.onrender.com'; // <--- Quando hospedar o backend, coloque o link aqui!

/**
 * 1. ELEMENTOS
 */
const audioHover = document.getElementById('audio-hover');
const areaEditorLetra = document.getElementById('texto-letra');
const listaMusicasDiv = document.getElementById('lista-musicas');
const inputPesquisa = document.getElementById('input-pesquisa');
const contadorMusicas = document.getElementById('contador-musicas');

const chatDisplay = document.getElementById('chat-mensagens');
const chatInput = document.getElementById('chat-input');
const btnEnviarChat = document.getElementById('btn-enviar-chat');

let todasAsMusicas = []; 

const playHoverSound = () => {
    if (audioHover) {
        audioHover.currentTime = 0;
        audioHover.play().catch(() => {});
    }
};

const aplicarSonsHover = () => {
    document.querySelectorAll('.js-hover-target').forEach(el => {
        el.removeEventListener('mouseover', playHoverSound);
        el.addEventListener('mouseover', playHoverSound);
    });
};

/**
 * 2. LÓGICA DE MÚSICAS
 */
function obterCorCategoria(categoria) {
    const cores = {
        'Adoração': '#3498db', 'Celebração': '#f1c40f', 'Especial': '#9b59b6', 'Início': '#2ecc71'
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
        <div class="item-musica js-hover-target" id="musica-${m._id}" style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid var(--cor-borda);">
            <div onclick="exibirLetra('${m._id}')" style="cursor:pointer; flex-grow: 1;">
                <span style="font-size: 0.7rem; background: ${obterCorCategoria(m.categoria)}; color: white; padding: 2px 6px; border-radius: 4px; text-transform: uppercase;">
                    ${m.categoria || 'Geral'}
                </span><br>
                <strong style="color: var(--cor-destaque)">${m.titulo}</strong><br>
                <small style="color: var(--cor-suave)">${m.artista}</small>
            </div>
            <button onclick="excluirMusica('${m._id}')" style="background:none; border:none; color: #ff4d4d; cursor:pointer; font-size: 1.2rem;">🗑️</button>
        </div>
    `).join('');
    aplicarSonsHover();
}

async function carregarMusicas() {
    try {
        // AJUSTADO: Agora usa a variável API_URL
        const res = await fetch(`${API_URL}/musics`);
        todasAsMusicas = await res.json();
        renderizarLista(todasAsMusicas);
    } catch (err) { console.error("Erro ao carregar músicas"); }
}

window.exibirLetra = async (id) => {
    const musica = todasAsMusicas.find(m => m._id === id);
    if (musica) {
        areaEditorLetra.value = musica.letra;
        document.querySelectorAll('.item-musica').forEach(i => i.classList.remove('selecionada'));
        document.getElementById(`musica-${id}`)?.classList.add('selecionada');
    }
};

// Adicionei a função de excluir que faltava no seu arquivo mas estava no server
window.excluirMusica = async (id) => {
    if (!confirm("Deseja realmente excluir esta música?")) return;
    try {
        await fetch(`${API_URL}/musics/${id}`, { method: 'DELETE' });
        carregarMusicas();
    } catch (err) { console.error("Erro ao excluir"); }
};

/**
 * 3. LÓGICA DO CHAT
 */
async function carregarMensagens() {
    try {
        // AJUSTADO: Agora usa a variável API_URL
        const res = await fetch(`${API_URL}/messages`);
        const mensagens = await res.json();
        if (mensagens.length > 0 && chatDisplay) {
            chatDisplay.innerHTML = mensagens.map(m => `
                <div style="margin-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 5px;">
                    <strong style="color: var(--cor-destaque); font-size: 0.8rem;">${new Date(m.data).toLocaleTimeString()} - Membro:</strong>
                    <p style="margin: 5px 0; color: white;">${m.texto}</p>
                </div>
            `).join('');
            chatDisplay.scrollTop = chatDisplay.scrollHeight;
        }
    } catch (err) { console.error("Erro ao carregar chat"); }
}

async function enviarMensagem() {
    const texto = chatInput.value.trim();
    if (!texto) return;
    try {
        // AJUSTADO: Agora usa a variável API_URL
        await fetch(`${API_URL}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ texto })
        });
        chatInput.value = '';
        carregarMensagens();
    } catch (err) { console.error("Erro ao enviar mensagem"); }
}

/**
 * 4. INICIALIZAÇÃO
 */
document.addEventListener('DOMContentLoaded', () => {
    carregarMusicas();
    carregarMensagens();
    setInterval(carregarMensagens, 4000); 
});

btnEnviarChat?.addEventListener('click', enviarMensagem);
chatInput?.addEventListener('keypress', (e) => { if (e.key === 'Enter') enviarMensagem(); });

inputPesquisa?.addEventListener('input', (e) => {
    const termo = e.target.value.toLowerCase();
    const filtradas = todasAsMusicas.filter(m => m.titulo.toLowerCase().includes(termo));
    renderizarLista(filtradas);
});

document.getElementById('btn-limpar-editor')?.addEventListener('click', () => {
    areaEditorLetra.value = "";
    document.querySelectorAll('.item-musica').forEach(i => i.classList.remove('selecionada'));
});

document.getElementById('btn-nova-ideia')?.addEventListener('click', () => {
    areaEditorLetra.value = "";
    document.querySelectorAll('.item-musica').forEach(item => item.classList.remove('selecionada'));
    document.getElementById('editor-letras').scrollIntoView({ behavior: 'smooth' });
    areaEditorLetra.focus();
});