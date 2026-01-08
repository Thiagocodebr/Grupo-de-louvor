/**
 * CONFIGURAÇÕES E ESTADO GLOBAL
 */
const API_URL = 'https://grupo-de-louvor-santa-esmeralda.onrender.com';
let todasAsMusicas = [];
let timerInterval = null;
const BANCO_EMOJIS = ['🙏','🎶','❤️','🙌','✨','🔥','😊','😂'];

// Proteção de Login
if (!localStorage.getItem('usuarioLogado')) {
    window.location.href = 'login.html';
}

/**
 * INICIALIZAÇÃO
 */
document.addEventListener('DOMContentLoaded', () => {
    const boasVindas = document.getElementById('boas-vindas');
    if (boasVindas) boasVindas.innerText = `Olá, ${localStorage.getItem('usuarioLogado')}!`;

    carregarMusicas();
    carregarMensagensEChat();
    carregarAgenda();
    
    // Atualização automática do Chat
    setInterval(carregarMensagensEChat, 10000);

    // Eventos dos botões fixos
    document.getElementById('input-pesquisa')?.addEventListener('input', filtrarMusicas);
    document.getElementById('btn-salvar-letra')?.addEventListener('click', salvarMusica);
});

/**
 * FUNÇÕES DE MÚSICA
 */
async function carregarMusicas() {
    try {
        const res = await fetch(`${API_URL}/musics`);
        todasAsMusicas = await res.json();
        renderizarLista(todasAsMusicas);
    } catch (e) {
        console.error("Erro ao carregar músicas:", e);
    }
}

function renderizarLista(musicas) {
    const lista = document.getElementById('lista-musicas');
    if (!lista) return;

    lista.innerHTML = musicas.map(m => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; border-bottom:1px solid #222;">
            <div onclick="exibirLetra('${m._id}')" style="cursor:pointer; flex-grow:1;">
                <span style="font-weight:bold; color:#fff;">${m.titulo}</span>
                <br><small style="color:#00d1b2;">${m.categoria || 'Geral'} | Tom: ${m.tom || 'N/D'}</small>
            </div>
            <button onclick="excluirMusica('${m._id}')" style="background:none; border:none; color:#ff4d4d; cursor:pointer; font-size:1.2rem;">&times;</button>
        </div>
    `).join('');
}

async function salvarMusica() {
    const titulo = prompt("Título da música:");
    if (!titulo) return;

    const editor = document.getElementById('texto-letra');
    const linkInput = document.getElementById('link-midia');
    const tomInput = document.getElementById('tom-musica');
    const categoriaSelect = document.getElementById('select-categoria');

    // Limpeza: remove cabeçalhos visuais antes de salvar para não duplicar
    const clone = editor.cloneNode(true);
    const headerAntigo = clone.querySelector('#header-dinamico');
    if (headerAntigo) headerAntigo.remove();

    const dados = {
        titulo: titulo,
        letra: clone.innerHTML,
        categoria: categoriaSelect.value,
        link: linkInput.value,
        tom: tomInput.value
    };

    try {
        const res = await fetch(`${API_URL}/musics`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        if (res.ok) {
            alert("Salvo com sucesso! ✨");
            linkInput.value = "";
            tomInput.value = "";
            editor.innerHTML = "";
            carregarMusicas();
        }
    } catch (e) {
        alert("Erro ao salvar no servidor.");
    }
}

window.exibirLetra = (id) => {
    const m = todasAsMusicas.find(x => x._id === id);
    if (!m) return;

    // Sincroniza os inputs de cima com os dados da música
    document.getElementById('link-midia').value = m.link || "";
    document.getElementById('tom-musica').value = m.tom || "";

    // Botão de link caso exista
    const btnLink = m.link ? `
        <a href="${m.link}" target="_blank" style="background:#1DB954; color:white; padding:6px 12px; border-radius:20px; text-decoration:none; font-size:0.8rem; font-weight:bold;">
            📺 VER VÍDEO
        </a>` : '';

    const header = `
        <div id="header-dinamico" contenteditable="false" style="margin-bottom:15px; padding-bottom:10px; border-bottom:1px solid #333; display:flex; justify-content:space-between; align-items:center;">
            <span style="background:#f1c40f; color:#000; padding:4px 10px; border-radius:15px; font-weight:bold; font-size:0.8rem;">TOM: ${m.tom || 'N/D'}</span>
            ${btnLink}
        </div>
    `;

    document.getElementById('texto-letra').innerHTML = header + m.letra;
};

/**
 * CHAT E UTILITÁRIOS
 */
async function carregarMensagensEChat() {
    try {
        const res = await fetch(`${API_URL}/messages`);
        const msgs = await res.json();
        
        // Quadro de Avisos
        const aviso = msgs.filter(m => m.texto.startsWith("SISTEMA_QUADRO:")).reverse()[0];
        const displayAviso = document.getElementById('quadro-avisos-display');
        if (displayAviso) displayAviso.innerText = aviso ? aviso.texto.split(':')[1] : "Sem avisos.";

        // Chat
        const chat = document.getElementById('chat-mensagens');
        if (chat) {
            chat.innerHTML = msgs.filter(m => !m.texto.includes("SISTEMA_") && !m.texto.includes("💡"))
                .map(m => `<p><b style="color:#00d1b2">${m.usuario}:</b> ${m.texto}</p>`).join('');
            chat.scrollTop = chat.scrollHeight;
        }
    } catch (e) { console.log("Erro ao carregar chat"); }
}

window.enviarChat = () => {
    const input = document.getElementById('chat-input');
    if (input.value) {
        enviarMensagem(input.value, localStorage.getItem('usuarioLogado'));
        input.value = '';
    }
};

async function enviarMensagem(texto, usuario) {
    await fetch(`${API_URL}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto, usuario })
    });
    carregarMensagensEChat();
}

/**
 * OUTRAS FUNÇÕES (PDF, AGENDA, ETC)
 */
window.execCmd = (cmd, val = null) => { document.execCommand(cmd, false, val); document.getElementById('texto-letra').focus(); };

window.filtrarMusicas = () => {
    const termo = document.getElementById('input-pesquisa').value.toLowerCase();
    renderizarLista(todasAsMusicas.filter(m => m.titulo.toLowerCase().includes(termo)));
};

window.excluirMusica = async (id) => {
    if (confirm("Excluir definitivamente?")) {
        await fetch(`${API_URL}/musics/${id}`, { method: 'DELETE' });
        carregarMusicas();
    }
};

window.sair = () => { localStorage.clear(); window.location.href = 'login.html'; };

function carregarAgenda() {
    const salva = localStorage.getItem('proximoEnsaio');
    if (salva) document.getElementById('data-ensaio-display').innerText = new Date(salva).toLocaleString('pt-BR');
}

window.gerarPDF = () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const texto = document.getElementById('texto-letra').innerText;
    doc.text(doc.splitTextToSize(texto, 180), 10, 20);
    doc.save("musica.pdf");
};
