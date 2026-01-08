/**
 * INICIALIZAÇÃO E CONFIGURAÇÕES
 */
if (!localStorage.getItem('usuarioLogado')) window.location.href = 'login.html';

const API_URL = 'https://grupo-de-louvor-santa-esmeralda.onrender.com';
let todasAsMusicas = [], timerInterval;
const BANCO_EMOJIS = ['🙏','🎶','❤️','🙌','✨','🔥','😊','😂'];

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('boas-vindas').innerText = `Olá, ${localStorage.getItem('usuarioLogado')}!`;
    carregarMusicas();
    carregarMensagensEChat();
    carregarAgenda();
    setInterval(carregarMensagensEChat, 10000); // Atualiza chat e avisos a cada 10s

    document.getElementById('btn-salvar-letra')?.addEventListener('click', salvarLetra);
});

/**
 * FUNÇÕES DE COMUNICAÇÃO (SERVER)
 */
async function enviarMensagemAoServidor(texto, usuario) {
    await fetch(`${API_URL}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto, usuario })
    });
    carregarMensagensEChat();
}

async function carregarMensagensEChat() {
    try {
        const res = await fetch(`${API_URL}/messages`);
        const msgs = await res.json();
        
        // 1. Quadro de Avisos
        const aviso = msgs.filter(m => m.texto.startsWith("SISTEMA_QUADRO:")).reverse()[0];
        document.getElementById('quadro-avisos-display').innerText = aviso ? aviso.texto.split(':')[1] : "Sem avisos novos.";
        
        // 2. Chat (Filtra apenas conversas)
        const chat = document.getElementById('chat-mensagens');
        chat.innerHTML = msgs.filter(m => !m.texto.includes("SISTEMA_") && !m.texto.includes("💡"))
            .map(m => `<p><b style="color:#00d1b2">${m.usuario}:</b> ${m.texto}</p>`).join('');
        chat.scrollTop = chat.scrollHeight;

        // 3. Mural de Ideias
        document.getElementById('mural-ideias-display').innerHTML = msgs.filter(m => m.texto.includes("💡"))
            .reverse().map(m => `<div style="background:#222; padding:10px; margin:5px; border-radius:5px;">${m.texto}</div>`).join('');

        // 4. Vaquinha
        const v = msgs.filter(m => m.texto.startsWith("SISTEMA_VAQUINHA:")).reverse()[0];
        const valor = v ? parseFloat(v.texto.split(':')[1]) : 0;
        const perc = Math.min((valor / 200) * 100, 100);
        document.querySelector('.progress-bar-fill').style.width = perc + '%';
        document.getElementById('porcentagem-label').innerText = Math.floor(perc) + '%';
    } catch(e) { console.error("Erro ao carregar mensagens", e); }
}

/**
 * MURAL DE IDEIAS E AVISOS
 */
window.adicionarNovaIdeia = async () => {
    const ideia = prompt("Sua sugestão para o grupo:");
    if (ideia) await enviarMensagemAoServidor(`💡 IDEIA: ${ideia}`, localStorage.getItem('usuarioLogado'));
};

window.editarQuadroAvisos = async () => {
    const n = prompt("Novo aviso geral:");
    if (n) await enviarMensagemAoServidor(`SISTEMA_QUADRO:${n}`, "LÍDER");
};

window.definirValorVaquinha = async () => {
    const v = prompt("Quanto já arrecadamos? (Apenas números)");
    if (v) await enviarMensagemAoServidor(`SISTEMA_VAQUINHA:${v}`, "SISTEMA");
};

/**
 * CONTADOR DE ENSAIO
 */
function atualizarCronometro(dataDestino) {
    const display = document.getElementById('countdown-timer');
    const container = document.getElementById('countdown-container');
    if (timerInterval) clearInterval(timerInterval);

    timerInterval = setInterval(() => {
        const diff = new Date(dataDestino).getTime() - new Date().getTime();
        if (diff <= 0) {
            display.innerText = "É HOJE! 🔥";
            container.style.display = 'block';
            return;
        }
        const d = Math.floor(diff / 86400000);
        const h = Math.floor((diff % 86400000) / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        display.innerText = `Faltam: ${d}d ${h}h ${m}m`;
        container.style.display = 'block';
    }, 1000);
}

window.definirNovoEnsaio = function() {
    const input = prompt("Data (AAAA-MM-DD HH:MM):", "2024-12-30 19:30");
    if (input) {
        localStorage.setItem('proximoEnsaio', input);
        carregarAgenda();
        enviarMensagemAoServidor(`📅 ENSAIO MARCADO: ${input}`, localStorage.getItem('usuarioLogado'));
    }
};

function carregarAgenda() {
    const salva = localStorage.getItem('proximoEnsaio');
    if (salva) {
        document.getElementById('data-ensaio-display').innerText = new Date(salva).toLocaleString();
        atualizarCronometro(salva);
    }
}

/**
 * GESTÃO DE MÚSICAS
 */
async function carregarMusicas() {
    const res = await fetch(`${API_URL}/musics`);
    todasAsMusicas = await res.json();
    document.getElementById('contador-musicas').innerText = todasAsMusicas.length;
    document.getElementById('lista-musicas').innerHTML = todasAsMusicas.map(m => `
        <div style="display:flex; justify-content:space-between; padding:8px; border-bottom:1px solid #222;">
            <span onclick="exibirLetra('${m._id}')" style="cursor:pointer">${m.titulo}</span>
            <button onclick="excluirMusica('${m._id}')" style="background:none; border:none; color:red; cursor:pointer;">X</button>
        </div>
    `).join('');
}

window.excluirMusica = async (id) => {
    if (confirm("Excluir música?")) {
        await fetch(`${API_URL}/musics/${id}`, { method: 'DELETE' });
        carregarMusicas();
    }
};

window.exibirLetra = (id) => {
    const m = todasAsMusicas.find(x => x._id === id);
    if (m) {
        document.getElementById('texto-letra').innerHTML = m.letra;
        window.scrollTo(0,0);
    }
};

async function salvarLetra() {
    const t = prompt("Nome da música:");
    const l = document.getElementById('texto-letra').innerHTML;
    if (t && l) {
        await fetch(`${API_URL}/musics`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ titulo: t, letra: l })
        });
        carregarMusicas();
    }
}

/**
 * UTILITÁRIOS
 */
window.enviarChat = () => {
    const i = document.getElementById('chat-input');
    if (i.value) { enviarMensagemAoServidor(i.value, localStorage.getItem('usuarioLogado')); i.value = ''; }
};

window.sair = () => { localStorage.clear(); window.location.href = 'login.html'; };
window.execCmd = (c, v=null) => document.execCommand(c, false, v);
window.toggleEmojiPicker = (id) => {
    const p = document.getElementById(id);
    p.innerHTML = BANCO_EMOJIS.map(e => `<span onclick="document.getElementById('texto-letra').innerHTML+='${e}'" style="cursor:pointer; padding:5px;">${e}</span>`).join('');
    p.style.display = p.style.display === 'flex' ? 'none' : 'flex';
};
