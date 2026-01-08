/**
 * CONFIGURAÇÃO GLOBAL
 */
const API_URL = 'https://grupo-de-louvor-santa-esmeralda.onrender.com';
let todasAsMusicas = [];
let timerInterval = null;

// Verifica login imediatamente
if (!localStorage.getItem('usuarioLogado')) {
    window.location.href = 'login.html';
}

/**
 * INICIALIZAÇÃO SEGURA
 */
document.addEventListener('DOMContentLoaded', async () => {
    console.log("Iniciando sistema...");
    
    // Atualiza nome do usuário
    const boasVindas = document.getElementById('boas-vindas');
    if (boasVindas) boasVindas.innerText = `Olá, ${localStorage.getItem('usuarioLogado')}!`;

    // Carregamento inicial com tratamento de erro individual
    try { await carregarMusicas(); } catch (e) { console.error("Erro Musicas:", e); }
    try { await carregarMensagensEChat(); } catch (e) { console.error("Erro Chat:", e); }
    try { carregarAgenda(); } catch (e) { console.error("Erro Agenda:", e); }

    // Polling (Atualização automática)
    setInterval(() => {
        carregarMensagensEChat().catch(e => console.log("Servidor dormindo..."));
    }, 10000);

    // Evento de Pesquisa
    document.getElementById('input-pesquisa')?.addEventListener('input', (e) => {
        const termo = e.target.value.toLowerCase();
        const filtradas = todasAsMusicas.filter(m => m.titulo.toLowerCase().includes(termo));
        renderizarLista(filtradas);
    });
});

/**
 * FUNÇÕES DE CARREGAMENTO
 */
async function carregarMusicas() {
    const lista = document.getElementById('lista-musicas');
    const res = await fetch(`${API_URL}/musics`);
    if (!res.ok) throw new Error("Erro ao buscar músicas");
    
    todasAsMusicas = await res.json();
    renderizarLista(todasAsMusicas);
}

function renderizarLista(musicas) {
    const lista = document.getElementById('lista-musicas');
    const contador = document.getElementById('contador-musicas');
    
    if (contador) contador.innerText = musicas.length;
    if (!lista) return;

    if (musicas.length === 0) {
        lista.innerHTML = '<p style="padding:15px; color:#888;">Nenhuma música encontrada.</p>';
        return;
    }

    lista.innerHTML = musicas.map(m => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; border-bottom:1px solid #222; animation: fadeIn 0.3s;">
            <span onclick="exibirLetra('${m._id}')" style="cursor:pointer; flex-grow:1; font-weight:500;">${m.titulo}</span>
            <button onclick="excluirMusica('${m._id}')" style="background:none; border:none; color:#ff4d4d; cursor:pointer; font-size:1.2rem; padding:0 10px;">&times;</button>
        </div>
    `).join('');
}

async function carregarMensagensEChat() {
    const res = await fetch(`${API_URL}/messages`);
    const msgs = await res.json();
    
    // 1. Quadro de Avisos
    const aviso = msgs.filter(m => m.texto.startsWith("SISTEMA_QUADRO:")).reverse()[0];
    const quadro = document.getElementById('quadro-avisos-display');
    if (quadro) quadro.innerText = aviso ? aviso.texto.split(':')[1] : "Seja bem-vindo!";

    // 2. Chat
    const chat = document.getElementById('chat-mensagens');
    if (chat) {
        chat.innerHTML = msgs.filter(m => !m.texto.includes("SISTEMA_") && !m.texto.includes("💡"))
            .map(m => `<p style="margin-bottom:8px;"><b style="color:#00d1b2">${m.usuario}:</b> ${m.texto}</p>`).join('');
        chat.scrollTop = chat.scrollHeight;
    }

    // 3. Vaquinha
    const v = msgs.filter(m => m.texto.startsWith("SISTEMA_VAQUINHA:")).reverse()[0];
    const valor = v ? parseFloat(v.texto.split(':')[1]) : 0;
    const perc = Math.min((valor / 200) * 100, 100);
    
    const barra = document.querySelector('.progress-bar-fill');
    if (barra) barra.style.width = perc + '%';
    const pLabel = document.getElementById('porcentagem-label');
    if (pLabel) pLabel.innerText = Math.floor(perc) + '%';
}

/**
 * UTILITÁRIOS
 */
window.copiarPix = () => {
    const chave = document.getElementById('chave-pix-texto').innerText;
    navigator.clipboard.writeText(chave).then(() => alert("Pix copiado! ❤️"));
};

window.excluirMusica = async (id) => {
    if (!confirm("Excluir música?")) return;
    await fetch(`${API_URL}/musics/${id}`, { method: 'DELETE' });
    carregarMusicas();
};

window.exibirLetra = (id) => {
    const m = todasAsMusicas.find(x => x._id === id);
    if (m) {
        const editor = document.getElementById('texto-letra');
        if (editor) editor.innerHTML = m.letra;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

function carregarAgenda() {
    const salva = localStorage.getItem('proximoEnsaio');
    const display = document.getElementById('data-ensaio-display');
    if (salva && display) {
        display.innerText = new Date(salva).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
        atualizarCronometro(salva);
    }
}

window.sair = () => { localStorage.clear(); window.location.href = 'login.html'; };
