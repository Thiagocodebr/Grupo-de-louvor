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
 * INICIALIZAÇÃO SEGURA
 */
document.addEventListener('DOMContentLoaded', () => {
    const boasVindas = document.getElementById('boas-vindas');
    if (boasVindas) boasVindas.innerText = `Olá, ${localStorage.getItem('usuarioLogado')}!`;

    // Carregamos cada parte separada para uma não travar a outra
    carregarMusicas().catch(e => console.error("Erro Letras:", e));
    carregarMensagensEChat().catch(e => console.error("Erro Chat/Avisos:", e));
    
    // Eventos
    document.getElementById('btn-salvar-letra')?.addEventListener('click', salvarMusica);
    document.getElementById('input-pesquisa')?.addEventListener('input', filtrarMusicas);
    
    // Polling do Chat
    setInterval(carregarMensagensEChat, 10000);
});

/**
 * GESTÃO DE MÚSICAS (LISTA E EDITOR)
 */
async function carregarMusicas() {
    const res = await fetch(`${API_URL}/musics`);
    todasAsMusicas = await res.json();
    renderizarLista(todasAsMusicas);
}

function renderizarLista(lista) {
    const container = document.getElementById('lista-musicas');
    if (!container) return;
    container.innerHTML = lista.map(m => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px; border-bottom:1px solid #222;">
            <div onclick="exibirLetra('${m._id}')" style="cursor:pointer; flex-grow:1;">
                <span style="font-weight:bold;">${m.titulo}</span>
                <br><small style="color:#00d1b2;">${m.categoria || 'Geral'} | Tom: ${m.tom || 'N/D'}</small>
            </div>
            <button onclick="excluirMusica('${m._id}')" style="background:none; border:none; color:#ff4d4d; cursor:pointer;">&times;</button>
        </div>
    `).join('');
}

window.exibirLetra = (id) => {
    const m = todasAsMusicas.find(x => x._id === id);
    if (!m) return;

    // Preenche os campos de cima (Tom e Link)
    document.getElementById('link-midia').value = m.link || "";
    document.getElementById('tom-musica').value = m.tom || "";

    const btnLink = m.link ? `<a href="${m.link}" target="_blank" style="background:#1DB954; color:white; padding:5px 10px; border-radius:15px; text-decoration:none; font-size:0.8rem;">📺 VÍDEO</a>` : '';

    const header = `
        <div id="header-dinamico" contenteditable="false" style="margin-bottom:15px; padding-bottom:10px; border-bottom:1px solid #333; display:flex; justify-content:space-between; align-items:center;">
            <span style="background:#f1c40f; color:#000; padding:4px 10px; border-radius:15px; font-weight:bold; font-size:0.8rem;">TOM: ${m.tom || 'N/D'}</span>
            ${btnLink}
        </div>
    `;
    document.getElementById('texto-letra').innerHTML = header + m.letra;
};

/**
 * SALVAMENTO (O QUE ESTAVA FALHANDO)
 */
async function salvarMusica() {
    const titulo = prompt("Título da música:");
    if (!titulo) return;

    const editor = document.getElementById('texto-letra');
    const linkValue = document.getElementById('link-midia').value;
    const tomValue = document.getElementById('tom-musica').value;
    const catValue = document.getElementById('select-categoria').value;

    // Criar clone para limpar o "lixo" visual antes de salvar
    const clone = editor.cloneNode(true);
    const header = clone.querySelector('#header-dinamico');
    if (header) header.remove();

    const dados = {
        titulo: titulo,
        letra: clone.innerHTML,
        categoria: catValue,
        link: linkValue,
        tom: tomValue
    };

    try {
        const res = await fetch(`${API_URL}/musics`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        if (res.ok) {
            alert("Salvo com sucesso! ✨");
            location.reload(); // Recarrega para limpar tudo e atualizar lista
        }
    } catch (e) {
        alert("Erro ao salvar. Verifique a internet.");
    }
}

/**
 * QUADRO DE AVISOS E CHAT
 */
async function carregarMensagensEChat() {
    try {
        const res = await fetch(`${API_URL}/messages`);
        const msgs = await res.json();

        // 1. Quadro de Avisos (Procura por SISTEMA_QUADRO)
        const aviso = msgs.filter(m => m.texto.startsWith("SISTEMA_QUADRO:")).reverse()[0];
        const displayAviso = document.getElementById('quadro-avisos-display');
        if (displayAviso) {
            displayAviso.innerText = aviso ? aviso.texto.replace("SISTEMA_QUADRO:", "") : "Sem avisos novos.";
        }

        // 2. Chat Normal
        const chatContainer = document.getElementById('chat-mensagens');
        if (chatContainer) {
            chatContainer.innerHTML = msgs.filter(m => !m.texto.includes("SISTEMA_"))
                .map(m => `<p><b>${m.usuario}:</b> ${m.texto}</p>`).join('');
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    } catch (e) {
        console.error("Erro ao carregar avisos/chat");
    }
}

/**
 * UTILITÁRIOS
 */
window.execCmd = (cmd, val = null) => { document.execCommand(cmd, false, val); document.getElementById('texto-letra').focus(); };
window.excluirMusica = async (id) => { if (confirm("Excluir?")) { await fetch(`${API_URL}/musics/${id}`, { method: 'DELETE' }); carregarMusicas(); } };
window.sair = () => { localStorage.clear(); window.location.href = 'login.html'; };
window.enviarChat = () => {
    const input = document.getElementById('chat-input');
    if (input.value) {
        fetch(`${API_URL}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ texto: input.value, usuario: localStorage.getItem('usuarioLogado') })
        }).then(() => { input.value = ''; carregarMensagensEChat(); });
    }
};
window.filtrarMusicas = () => {
    const termo = document.getElementById('input-pesquisa').value.toLowerCase();
    renderizarLista(todasAsMusicas.filter(m => m.titulo.toLowerCase().includes(termo)));
};
window.editarQuadroAvisos = () => {
    const novoAviso = prompt("Digite o novo aviso do quadro:");
    if (novoAviso) {
        fetch(`${API_URL}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ texto: `SISTEMA_QUADRO:${novoAviso}`, usuario: "LÍDER" })
        }).then(() => carregarMensagensEChat());
    }
};
