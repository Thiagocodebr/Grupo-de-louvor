/**
 * INICIALIZAÇÃO E CONFIGURAÇÕES
 */
if (!localStorage.getItem('usuarioLogado')) window.location.href = 'login.html';

const API_URL = 'https://grupo-de-louvor-santa-esmeralda.onrender.com';
let todasAsMusicas = [], timerInterval;
const BANCO_EMOJIS = ['🙏','🎶','❤️','🙌','✨','🔥','😊','😂','👏','🎸','🎹','🎤'];

document.addEventListener('DOMContentLoaded', () => {
    // Boas-vindas personalizado
    const nomeUsuario = localStorage.getItem('usuarioLogado');
    document.getElementById('boas-vindas').innerText = `Olá, ${nomeUsuario}!`;

    // Inicialização de dados
    carregarMusicas();
    carregarMensagensEChat();
    carregarAgenda();
    
    // Polling do Chat e Avisos (10s)
    setInterval(carregarMensagensEChat, 10000);

    // Event Listeners fixos
    document.getElementById('btn-salvar-letra')?.addEventListener('click', salvarLetra);
    document.getElementById('chat-input')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') enviarChat();
    });
});

/**
 * FUNÇÕES DE COMUNICAÇÃO (SERVER)
 */
async function enviarMensagemAoServidor(texto, usuario) {
    try {
        await fetch(`${API_URL}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ texto, usuario })
        });
        carregarMensagensEChat();
    } catch (e) {
        console.error("Erro ao conectar com servidor.");
    }
}

async function carregarMensagensEChat() {
    try {
        const res = await fetch(`${API_URL}/messages`);
        const msgs = await res.json();
        
        // 1. Quadro de Avisos (Pega o último comando SISTEMA_QUADRO)
        const aviso = msgs.filter(m => m.texto.startsWith("SISTEMA_QUADRO:")).reverse()[0];
        document.getElementById('quadro-avisos-display').innerText = aviso ? aviso.texto.split(':')[1] : "Sem avisos novos.";
        
        // 2. Chat (Filtra apenas conversas humanas)
        const chat = document.getElementById('chat-mensagens');
        chat.innerHTML = msgs.filter(m => !m.texto.includes("SISTEMA_") && !m.texto.includes("💡"))
            .map(m => `<p><b style="color:#00d1b2">${m.usuario}:</b> ${m.texto}</p>`).join('');
        chat.scrollTop = chat.scrollHeight;

        // 3. Mural de Ideias (Filtra mensagens com emoji de lâmpada)
        document.getElementById('mural-ideias-display').innerHTML = msgs.filter(m => m.texto.includes("💡"))
            .reverse().map(m => `
                <div style="background:rgba(255,255,255,0.05); padding:10px; margin:5px 0; border-radius:8px; border-left: 3px solid #f1c40f;">
                    <small style="color:#888;">${m.usuario}:</small><br>${m.texto}
                </div>
            `).join('');

        // 4. Vaquinha Automática
        const v = msgs.filter(m => m.texto.startsWith("SISTEMA_VAQUINHA:")).reverse()[0];
        const valorArrecadado = v ? parseFloat(v.texto.split(':')[1]) : 0;
        const meta = 200;
        const perc = Math.min((valorArrecadado / meta) * 100, 100);
        
        const barra = document.querySelector('.progress-bar-fill');
        if (barra) barra.style.width = perc + '%';
        document.getElementById('porcentagem-label').innerText = Math.floor(perc) + '%';
    } catch(e) { 
        console.log("Servidor em repouso ou offline..."); 
    }
}

/**
 * UTILITÁRIOS DA COMUNIDADE
 */
window.copiarPix = () => {
    const chave = document.getElementById('chave-pix-texto').innerText;
    navigator.clipboard.writeText(chave);
    alert("Chave Pix copiada! ❤️");
};

window.adicionarNovaIdeia = async () => {
    const ideia = prompt("Sua sugestão para o grupo:");
    if (ideia) await enviarMensagemAoServidor(`💡 IDEIA: ${ideia}`, localStorage.getItem('usuarioLogado'));
};

window.editarQuadroAvisos = async () => {
    const n = prompt("Novo aviso geral:");
    if (n) await enviarMensagemAoServidor(`SISTEMA_QUADRO:${n}`, "LÍDER");
};

window.definirValorVaquinha = async () => {
    const v = prompt("Quanto já arrecadamos no total? (Apenas números)");
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
        const agora = new Date().getTime();
        const alvo = new Date(dataDestino).getTime();
        const diff = alvo - agora;

        if (diff <= 0) {
            display.innerText = "É HOJE! 🔥";
            container.style.display = 'block';
            return;
        }

        const d = Math.floor(diff / 86400000);
        const h = Math.floor((diff % 86400000) / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        
        display.innerText = `${d}d ${h}h ${m}m`;
        container.style.display = 'block';
    }, 1000);
}

window.definirNovoEnsaio = function() {
    const input = prompt("Data do ensaio (AAAA-MM-DD HH:MM):", "2026-01-31 19:30");
    if (input) {
        localStorage.setItem('proximoEnsaio', input);
        carregarAgenda();
        enviarMensagemAoServidor(`📅 ENSAIO MARCADO: ${input}`, localStorage.getItem('usuarioLogado'));
    }
};

function carregarAgenda() {
    const salva = localStorage.getItem('proximoEnsaio');
    if (salva) {
        const data = new Date(salva);
        document.getElementById('data-ensaio-display').innerText = data.toLocaleDateString('pt-BR') + " às " + data.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'});
        atualizarCronometro(salva);
    }
}

/**
 * GESTÃO DE MÚSICAS
 */
async function carregarMusicas() {
    try {
        const res = await fetch(`${API_URL}/musics`);
        todasAsMusicas = await res.json();
        document.getElementById('contador-musicas').innerText = todasAsMusicas.length;
        renderizarLista(todasAsMusicas);
    } catch (e) { console.error("Erro ao carregar músicas"); }
}

function renderizarLista(musicas) {
    document.getElementById('lista-musicas').innerHTML = musicas.map(m => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px; border-bottom:1px solid #222;">
            <span onclick="exibirLetra('${m._id}')" style="cursor:pointer; flex-grow:1;">${m.titulo}</span>
            <button onclick="excluirMusica('${m._id}')" style="background:none; border:none; color:#ff4d4d; font-weight:bold; cursor:pointer; padding:5px;">&times;</button>
        </div>
    `).join('');
}

window.excluirMusica = async (id) => {
    if (confirm("Deseja excluir esta música permanentemente?")) {
        await fetch(`${API_URL}/musics/${id}`, { method: 'DELETE' });
        carregarMusicas();
    }
};

window.exibirLetra = (id) => {
    const m = todasAsMusicas.find(x => x._id === id);
    if (m) {
        document.getElementById('texto-letra').innerHTML = m.letra;
        window.scrollTo({ top: 0, behavior: 'smooth' });
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
        alert("Música salva!");
    }
}

/**
 * UTILITÁRIOS GERAIS
 */
window.enviarChat = () => {
    const i = document.getElementById('chat-input');
    if (i.value.trim()) { 
        enviarMensagemAoServidor(i.value, localStorage.getItem('usuarioLogado')); 
        i.value = ''; 
    }
};

window.sair = () => { localStorage.clear(); window.location.href = 'login.html'; };

window.execCmd = (c, v=null) => document.execCommand(c, false, v);

window.toggleEmojiPicker = (id) => {
    const p = document.getElementById(id);
    if (p.style.display === 'flex') {
        p.style.display = 'none';
    } else {
        p.innerHTML = BANCO_EMOJIS.map(e => `
            <span onclick="inserirEmoji('${e}', '${id}')" style="cursor:pointer; padding:8px; font-size:1.2rem;">${e}</span>
        `).join('');
        p.style.display = 'flex';
        p.style.flexWrap = 'wrap';
        p.style.background = '#333';
        p.style.borderRadius = '8px';
        p.style.position = 'absolute';
        p.style.zIndex = '100';
