/**
 * CONFIGURAÇÕES E INICIALIZAÇÃO
 */
if (!localStorage.getItem('usuarioLogado')) window.location.href = 'login.html';

const API_URL = window.location.hostname.includes('localhost') ? 'http://localhost:5000' : 'https://grupo-de-louvor-santa-esmeralda.onrender.com';
let todasAsMusicas = [], listaTemporariaLinks = [], tituloMusicaAtual = "", timerInterval;
const BANCO_EMOJIS = ['🙏','🎶','❤️','🙌','✨','🔥','😊','😂','👏','🎸','🎹','🎤','🌟'];

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('boas-vindas').innerText = `Olá, ${localStorage.getItem('usuarioLogado')}! 🙏`;
    carregarMusicas();
    carregarMensagensEChat();
    carregarAgenda(); 
    setInterval(carregarMensagensEChat, 10000);

    document.getElementById('btn-add-link')?.addEventListener('click', adicionarLinkTemporario);
    document.getElementById('btn-salvar-letra')?.addEventListener('click', salvarLetra);
    document.getElementById('btn-enviar-chat')?.addEventListener('click', enviarChat);
});

/**
 * CONTADOR DE DIAS (LOGICA)
 */
function atualizarCronometro(dataDestino) {
    const display = document.getElementById('countdown-timer');
    const container = document.getElementById('countdown-container');
    const target = new Date(dataDestino).getTime();

    if (isNaN(target)) {
        container.style.display = 'none';
        return;
    }

    if (timerInterval) clearInterval(timerInterval);

    timerInterval = setInterval(() => {
        const agora = new Date().getTime();
        const diff = target - agora;

        if (diff <= 0) {
            clearInterval(timerInterval);
            display.innerText = "É HOJE! 🔥";
            container.style.display = 'block';
            return;
        }

        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        display.innerText = `${d}d ${h}h ${m}m`;
        container.style.display = 'block';
    }, 1000);
}

window.definirNovoEnsaio = function() {
    const input = prompt("Data do ensaio (AAAA-MM-DD HH:MM):\nEx: 2024-12-31 19:30");
    if (!input) return;

    const dataObj = new Date(input);
    if (isNaN(dataObj.getTime())) return alert("Formato inválido! Use AAAA-MM-DD HH:MM");

    localStorage.setItem('proximoEnsaio', input);
    const formatada = dataObj.toLocaleDateString('pt-BR') + " às " + dataObj.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'});
    document.getElementById('data-ensaio-display').innerText = formatada;
    
    atualizarCronometro(input);
    enviarMensagemAoServidor(`📅 NOVO ENSAIO: ${formatada}`, localStorage.getItem('usuarioLogado'));
};

function carregarAgenda() {
    const salva = localStorage.getItem('proximoEnsaio');
    if (salva) {
        const dataObj = new Date(salva);
        document.getElementById('data-ensaio-display').innerText = dataObj.toLocaleDateString('pt-BR') + " às " + dataObj.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'});
        atualizarCronometro(salva);
    }
}

/**
 * VAQUINHA, CHAT E QUADRO
 */
window.copiarPix = () => {
    navigator.clipboard.writeText(document.getElementById('chave-pix-texto').innerText);
    alert("Pix copiado! ❤️");
};

window.definirValorVaquinha = async () => {
    const v = prompt("Total arrecadado (R$):");
    if (v) {
        await enviarMensagemAoServidor(`SISTEMA_VAQUINHA:${v}`, "SISTEMA");
        carregarProgressoVaquinha();
    }
};

async function carregarProgressoVaquinha() {
    const res = await fetch(`${API_URL}/messages`);
    const msgs = await res.json();
    const v = msgs.filter(m => m.texto.startsWith("SISTEMA_VAQUINHA:")).reverse()[0];
    const valor = v ? parseFloat(v.texto.split(':')[1]) : 0;
    const meta = 200;
    const perc = Math.min((valor / meta) * 100, 100);
    document.querySelector('.progress-bar-fill').style.width = perc + '%';
    document.getElementById('porcentagem-label').innerText = Math.floor(perc) + '%';
}

async function carregarMensagensEChat() {
    try {
        const res = await fetch(`${API_URL}/messages`);
        const msgs = await res.json();
        
        // Quadro de Avisos
        const aviso = msgs.filter(m => m.texto.startsWith("SISTEMA_QUADRO:")).reverse()[0];
        document.getElementById('quadro-avisos-display').innerText = aviso ? aviso.texto.split(':')[1] : "Sem avisos.";
        
        // Progresso Vaquinha
        carregarProgressoVaquinha();

        // Chat (Filtra comandos de sistema)
        const chat = document.getElementById('chat-mensagens');
        chat.innerHTML = msgs.filter(m => !m.texto.includes("SISTEMA_") && !m.texto.includes("💡"))
            .map(m => `<p><b style="color:#00d1b2">${m.usuario}:</b> ${m.texto}</p>`).join('');
        chat.scrollTop = chat.scrollHeight;

        // Mural
        document.getElementById('mural-ideias-display').innerHTML = msgs.filter(m => m.texto.includes("💡")).reverse().slice(0,5)
            .map(m => `<div style="background:#222; margin:5px; padding:8px; border-radius:5px;">${m.texto}</div>`).join('');
    } catch(e) {}
}

async function enviarMensagemAoServidor(texto, usuario) {
    await fetch(`${API_URL}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto, usuario })
    });
    carregarMensagensEChat();
}

async function enviarChat() {
    const i = document.getElementById('chat-input');
    if (i.value) { await enviarMensagemAoServidor(i.value, localStorage.getItem('usuarioLogado')); i.value = ''; }
}

window.editarQuadroAvisos = async () => {
    const n = prompt("Novo aviso:");
    if (n) await enviarMensagemAoServidor(`SISTEMA_QUADRO:${n}`, "LÍDER");
};

/**
 * GESTÃO DE MÚSICAS
 */
async function carregarMusicas() {
    const res = await fetch(`${API_URL}/musics`);
    todasAsMusicas = await res.json();
    renderizarLista(todasAsMusicas);
}

function renderizarLista(musicas) {
    document.getElementById('contador-musicas').innerText = musicas.length;
    document.getElementById('lista-musicas').innerHTML = musicas.map(m => `
        <div style="display:flex; justify-content:space-between; padding:10px; border-bottom:1px solid #333;">
            <div onclick="exibirLetra('${m._id}')" style="cursor:pointer">${m.titulo}</div>
            <button onclick="excluirMusica('${m._id}')" style="color:red; background:none; border:none;">&times;</button>
        </div>
    `).join('');
}

window.exibirLetra = (id) => {
    const m = todasAsMusicas.find(x => x._id === id);
    if (m) {
        tituloMusicaAtual = m.titulo;
        document.getElementById('texto-letra').innerHTML = m.letra;
        window.scrollTo(0,0);
    }
};

async function salvarLetra() {
    const t = prompt("Título:", tituloMusicaAtual);
    if (!t) return;
    await fetch(`${API_URL}/musics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo: t, letra: document.getElementById('texto-letra').innerHTML })
    });
    carregarMusicas();
}

window.toggleEmojiPicker = (id) => {
    const p = document.getElementById(id);
    p.innerHTML = BANCO_EMOJIS.map(e => `<span onclick="colarEmoji('${e}','${id}')" style="cursor:pointer; padding:5px;">${e}</span>`).join('');
    p.style.display = p.style.display === 'flex' ? 'none' : 'flex';
};

window.colarEmoji = (e, id) => {
    const target = id === 'picker-chat' ? 'chat-input' : 'texto-letra';
    const el = document.getElementById(target);
    if (target === 'chat-input') el.value += e; else el.innerHTML += e;
    document.getElementById(id).style.display = 'none';
};

window.sair = () => { localStorage.clear(); window.location.href = 'login.html'; };
window.execCmd = (c, v=null) => document.execCommand(c, false, v);

window.excluirMusica = async (id) => {
    if (confirm("Deseja realmente excluir esta música?")) {
        await fetch(`${API_URL}/musics/${id}`, { method: 'DELETE' });
        carregarMusicas();
    }
};
