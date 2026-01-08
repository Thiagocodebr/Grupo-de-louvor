/**
 * CONFIGURAÇÕES GLOBAIS
 */
const API_URL = 'https://grupo-de-louvor-santa-esmeralda.onrender.com';
let todasAsMusicas = [];

// Proteção de Login
if (!localStorage.getItem('usuarioLogado')) {
    window.location.href = 'login.html';
}

/**
 * INICIALIZAÇÃO COMPLETA
 */
document.addEventListener('DOMContentLoaded', () => {
    const boasVindas = document.getElementById('boas-vindas');
    if (boasVindas) boasVindas.innerText = `Olá, ${localStorage.getItem('usuarioLogado')}!`;

    // Disparar carregamentos de forma independente
    carregarMusicas();
    carregarMensagensEChat();
    carregarAgenda();
    
    // Event Listeners dos Botões
    document.getElementById('btn-salvar-letra')?.addEventListener('click', salvarMusica);
    document.getElementById('input-pesquisa')?.addEventListener('input', filtrarMusicas);
    document.getElementById('btn-gerar-pdf')?.addEventListener('click', gerarPDF);
    
    // Atualização automática do chat e avisos
    setInterval(carregarMensagensEChat, 10000);
});

/**
 * MÚSICAS E REPERTÓRIO
 */
async function carregarMusicas() {
    try {
        const res = await fetch(`${API_URL}/musics`);
        todasAsMusicas = await res.json();
        renderizarLista(todasAsMusicas);
    } catch (e) {
        console.error("Erro ao carregar banco de músicas:", e);
    }
}

function renderizarLista(lista) {
    const container = document.getElementById('lista-musicas');
    const contador = document.getElementById('contador-musicas');
    
    if (contador) contador.innerText = lista.length;
    if (!container) return;

    container.innerHTML = lista.map(m => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px; border-bottom:1px solid #222;">
            <div onclick="exibirLetra('${m._id}')" style="cursor:pointer; flex-grow:1;">
                <span style="font-weight:bold; color:white;">${m.titulo}</span>
                <br><small style="color:#00d1b2;">${m.categoria || 'Geral'} | Tom: ${m.tom || 'N/D'}</small>
            </div>
            <button onclick="excluirMusica('${m._id}')" style="background:none; border:none; color:#ff4d4d; cursor:pointer;">&times;</button>
        </div>
    `).join('');
}

window.exibirLetra = (id) => {
    const m = todasAsMusicas.find(x => x._id === id);
    if (!m) return;

    document.getElementById('link-midia').value = m.link || "";
    document.getElementById('tom-musica').value = m.tom || "";

    const btnLink = m.link ? `<a href="${m.link}" target="_blank" style="background:#1DB954; color:white; padding:5px 10px; border-radius:15px; text-decoration:none; font-size:0.8rem; font-weight:bold;">📺 VÍDEO</a>` : '';

    const header = `
        <div id="header-dinamico" contenteditable="false" style="margin-bottom:15px; padding-bottom:10px; border-bottom:1px solid #333; display:flex; justify-content:space-between; align-items:center;">
            <span style="background:#f1c40f; color:#000; padding:4px 10px; border-radius:15px; font-weight:bold; font-size:0.8rem;">TOM: ${m.tom || 'N/D'}</span>
            ${btnLink}
        </div>
    `;
    document.getElementById('texto-letra').innerHTML = header + m.letra;
};

/**
 * SALVAMENTO
 */
async function salvarMusica() {
    const titulo = prompt("Título da música:");
    if (!titulo) return;

    const editor = document.getElementById('texto-letra');
    const clone = editor.cloneNode(true);
    const header = clone.querySelector('#header-dinamico');
    if (header) header.remove();

    const dados = {
        titulo: titulo,
        letra: clone.innerHTML,
        categoria: document.getElementById('select-categoria').value,
        link: document.getElementById('link-midia').value,
        tom: document.getElementById('tom-musica').value
    };

    const res = await fetch(`${API_URL}/musics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
    });

    if (res.ok) {
        alert("Música salva!");
        carregarMusicas();
    }
}

/**
 * CHAT, QUADRO E MURAL DE IDEIAS
 */
async function carregarMensagensEChat() {
    try {
        const res = await fetch(`${API_URL}/messages`);
        const msgs = await res.json();

        // Quadro de Avisos
        const aviso = msgs.filter(m => m.texto.startsWith("SISTEMA_QUADRO:")).reverse()[0];
        const displayAviso = document.getElementById('quadro-avisos-display');
        if (displayAviso) displayAviso.innerText = aviso ? aviso.texto.replace("SISTEMA_QUADRO:", "") : "Seja bem vindo.";

        // Mural de Ideias (💡)
        const mural = document.getElementById('mural-ideias-display');
        if (mural) {
            mural.innerHTML = msgs.filter(m => m.texto.includes("💡")).reverse()
                .map(m => `<div style="background:#222; padding:8px; margin:5px 0; border-radius:5px;">${m.texto}</div>`).join('');
        }

        // Chat
        const chatContainer = document.getElementById('chat-mensagens');
        if (chatContainer) {
            chatContainer.innerHTML = msgs.filter(m => !m.texto.includes("SISTEMA_") && !m.texto.includes("💡"))
                .map(m => `<p><b>${m.usuario}:</b> ${m.texto}</p>`).join('');
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    } catch (e) { console.log("Erro ao carregar mensagens"); }
}

/**
 * AGENDA E PDF
 */
function carregarAgenda() {
    const salva = localStorage.getItem('proximoEnsaio');
    const display = document.getElementById('data-ensaio-display');
    if (salva && display) display.innerText = new Date(salva).toLocaleString('pt-BR');
}

window.definirNovoEnsaio = () => {
    const input = prompt("Data (AAAA-MM-DD HH:MM):", "2026-01-11 19:30");
    if (input) {
        localStorage.setItem('proximoEnsaio', input);
        carregarAgenda();
        enviarMensagem(`📅 NOVO ENSAIO: ${input}`, localStorage.getItem('usuarioLogado'));
    }
};

window.gerarPDF = () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const texto = document.getElementById('texto-letra').innerText;
    doc.text(doc.splitTextToSize(texto, 180), 10, 20);
    doc.save("musica.pdf");
};

window.gerarLivretoCompleto = () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let y = 20;
    todasAsMusicas.forEach((m, i) => {
        if (i > 0) doc.addPage();
        doc.setFontSize(16);
        doc.text(m.titulo, 10, 20);
        doc.setFontSize(11);
        const letraLimpa = m.letra.replace(/<[^>]*>?/gm, '');
        doc.text(doc.splitTextToSize(letraLimpa, 180), 10, 35);
    });
    doc.save("Livreto_Santa_Esmeralda.pdf");
};

/**
 * FUNÇÕES AUXILIARES
 */
async function enviarMensagem(texto, usuario) {
    await fetch(`${API_URL}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto, usuario })
    });
    carregarMensagensEChat();
}

window.adicionarNovaIdeia = () => {
    const id = prompt("Sua ideia:");
    if (id) enviarMensagem(`💡 IDEIA: ${id}`, localStorage.getItem('usuarioLogado'));
};

window.enviarChat = () => {
    const i = document.getElementById('chat-input');
    if (i.value) { enviarMensagem(i.value, localStorage.getItem('usuarioLogado')); i.value = ''; }
};

window.excluirMusica = async (id) => { if (confirm("Excluir?")) { await fetch(`${API_URL}/musics/${id}`, { method: 'DELETE' }); carregarMusicas(); } };
window.execCmd = (cmd, val = null) => { document.execCommand(cmd, false, val); document.getElementById('texto-letra').focus(); };
window.filtrarMusicas = () => {
    const termo = document.getElementById('input-pesquisa').value.toLowerCase();
    renderizarLista(todasAsMusicas.filter(m => m.titulo.toLowerCase().includes(termo)));
};
window.editarQuadroAvisos = () => {
    const n = prompt("Novo aviso:");
    if (n) enviarMensagem(`SISTEMA_QUADRO:${n}`, "LÍDER");
};
window.sair = () => { localStorage.clear(); window.location.href = 'login.html'; };
