/**
 * CONFIGURAÇÕES INICIAIS
 */
const API_URL = 'https://grupo-de-louvor-santa-esmeralda.onrender.com';
let todasAsMusicas = [], timerInterval;
const BANCO_EMOJIS = ['🙏','🎶','❤️','🙌','✨','🔥','😊','😂'];

// Proteção de Login
if (!localStorage.getItem('usuarioLogado')) {
    window.location.href = 'login.html';
}

document.addEventListener('DOMContentLoaded', () => {
    const nome = localStorage.getItem('usuarioLogado');
    const boasVindas = document.getElementById('boas-vindas');
    if (boasVindas) boasVindas.innerText = `Olá, ${nome}!`;

    // Disparar carregamentos
    carregarMusicas();
    carregarMensagensEChat();
    carregarAgenda();
    
    // Atualização automática (Polling)
    setInterval(carregarMensagensEChat, 10000);

    // Listener para o campo de pesquisa (evita o "carregando" infinito)
    document.getElementById('input-pesquisa')?.addEventListener('input', filtrarMusicas);
});

/**
 * GESTÃO DE MÚSICAS (REPERTÓRIO)
 */
async function carregarMusicas() {
    const lista = document.getElementById('lista-musicas');
    try {
        const res = await fetch(`${API_URL}/musics`);
        if (!res.ok) throw new Error('Erro na rede');
        
        todasAsMusicas = await res.json();
        renderizarLista(todasAsMusicas);
    } catch (e) {
        console.error("Erro ao carregar músicas:", e);
        if (lista) lista.innerHTML = "<p style='color: #ff4d4d; padding: 10px;'>Erro ao conectar com o servidor. Verifique se o Render está ativo.</p>";
    }
}

function renderizarLista(musicas) {
    const lista = document.getElementById('lista-musicas');
    const contador = document.getElementById('contador-musicas');
    
    if (contador) contador.innerText = musicas.length;
    if (!lista) return;

    if (musicas.length === 0) {
        lista.innerHTML = "<p style='padding: 10px;'>Nenhuma música encontrada.</p>";
        return;
    }

    lista.innerHTML = musicas.map(m => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px; border-bottom:1px solid #222;">
            <span onclick="exibirLetra('${m._id}')" style="cursor:pointer; flex-grow:1;">${m.titulo}</span>
            <button onclick="excluirMusica('${m._id}')" style="background:none; border:none; color:#ff4d4d; font-weight:bold; cursor:pointer; padding:5px;">&times;</button>
        </div>
    `).join('');
}

function filtrarMusicas() {
    const termo = document.getElementById('input-pesquisa').value.toLowerCase();
    const filtradas = todasAsMusicas.filter(m => m.titulo.toLowerCase().includes(termo));
    renderizarLista(filtradas);
}

/**
 * SISTEMA DE CHAT, VAQUINHA E AVISOS
 */
async function carregarMensagensEChat() {
    try {
        const res = await fetch(`${API_URL}/messages`);
        const msgs = await res.json();
        
        // Atualizar Quadro de Avisos
        const aviso = msgs.filter(m => m.texto.startsWith("SISTEMA_QUADRO:")).reverse()[0];
        const quadroDisplay = document.getElementById('quadro-avisos-display');
        if (quadroDisplay) quadroDisplay.innerText = aviso ? aviso.texto.split(':')[1] : "Sem avisos novos.";
        
        // Atualizar Chat
        const chat = document.getElementById('chat-mensagens');
        if (chat) {
            chat.innerHTML = msgs.filter(m => !m.texto.includes("SISTEMA_") && !m.texto.includes("💡"))
                .map(m => `<p><b style="color:#00d1b2">${m.usuario}:</b> ${m.texto}</p>`).join('');
            chat.scrollTop = chat.scrollHeight;
        }

        // Atualizar Mural de Ideias
        const mural = document.getElementById('mural-ideias-display');
        if (mural) {
            mural.innerHTML = msgs.filter(m => m.texto.includes("💡")).reverse()
                .map(m => `<div style="background:#222; padding:8px; margin:5px 0; border-radius:5px; font-size: 0.9rem;">${m.texto}</div>`).join('');
        }

        // Atualizar Barra da Vaquinha
        const v = msgs.filter(m => m.texto.startsWith("SISTEMA_VAQUINHA:")).reverse()[0];
        const valor = v ? parseFloat(v.texto.split(':')[1]) : 0;
        const perc = Math.min((valor / 200) * 100, 100);
        const barra = document.querySelector('.progress-bar-fill');
        const label = document.getElementById('porcentagem-label');
        
        if (barra) barra.style.width = perc + '%';
        if (label) label.innerText = Math.floor(perc) + '%';

    } catch(e) { console.log("Aguardando servidor..."); }
}

/**
 * UTILITÁRIOS (PIX, AGENDA, EDITOR)
 */
window.copiarPix = () => {
    const texto = document.getElementById('chave-pix-texto')?.innerText || "seu-email@exemplo.com";
    navigator.clipboard.writeText(texto);
    alert("Chave Pix copiada! ❤️");
};

window.definirNovoEnsaio = function() {
    const input = prompt("Data do ensaio (AAAA-MM-DD HH:MM):", "2026-01-31 19:30");
    if (input) {
        localStorage.setItem('proximoEnsaio', input);
        carregarAgenda();
    }
};

function carregarAgenda() {
    const salva = localStorage.getItem('proximoEnsaio');
    const display = document.getElementById('data-ensaio-display');
    if (salva && display) {
        display.innerText = new Date(salva).toLocaleString('pt-BR');
        atualizarCronometro(salva);
    }
}

function atualizarCronometro(dataDestino) {
    const display = document.getElementById('countdown-timer');
    const container = document.getElementById('countdown-container');
    if (timerInterval) clearInterval(timerInterval);

    timerInterval = setInterval(() => {
        const diff = new Date(dataDestino).getTime() - new Date().getTime();
        if (diff <= 0) {
            if (display) display.innerText = "É HOJE! 🔥";
            return;
        }
        const d = Math.floor(diff / 86400000);
        const h = Math.floor((diff % 86400000) / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        if (display) display.innerText = `${d}d ${h}h ${m}m`;
        if (container) container.style.display = 'block';
    }, 1000);
}

// Funções globais necessárias para o HTML
window.sair = () => { localStorage.clear(); window.location.href = 'login.html'; };
window.execCmd = (c, v=null) => document.execCommand(c, false, v);
window.enviarChat = () => {
    const i = document.getElementById('chat-input');
    if (i && i.value) { enviarMensagemAoServidor(i.value, localStorage.getItem('usuarioLogado')); i.value = ''; }
};

async function enviarMensagemAoServidor(texto, usuario) {
    await fetch(`${API_URL}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto, usuario })
    });
    carregarMensagensEChat();
}
