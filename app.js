/**
 * CONFIGURAÇÕES GLOBAIS
 */
const API_URL = 'https://grupo-de-louvor-santa-esmeralda.onrender.com';
let todasAsMusicas = [];

// 1. Proteção de Login Simples
if (!localStorage.getItem('usuarioLogado')) {
    window.location.href = 'login.html';
}

/**
 * INICIALIZAÇÃO (Onde o app começa)
 */
document.addEventListener('DOMContentLoaded', () => {
    // Exibe nome do usuário
    const boasVindas = document.getElementById('boas-vindas');
    if (boasVindas) boasVindas.innerText = `Olá, ${localStorage.getItem('usuarioLogado')}!`;

    // Dispara as funções principais
    carregarMusicas();
    carregarMensagens();
    
    // Atualiza chat a cada 10 segundos
    setInterval(carregarMensagens, 10000);
});

/**
 * BUSCAR MÚSICAS DO BANCO DE DADOS
 */
async function carregarMusicas() {
    try {
        const res = await fetch(`${API_URL}/musics`);
        if (!res.ok) throw new Error("Erro na rede");
        todasAsMusicas = await res.json();
        renderizarLista(todasAsMusicas);
    } catch (erro) {
        console.error("Erro ao conectar com o banco:", erro);
        document.getElementById('lista-musicas').innerHTML = "<p style='color:red; padding:10px;'>Erro ao carregar banco de dados.</p>";
    }
}

function renderizarLista(lista) {
    const container = document.getElementById('lista-musicas');
    const contador = document.getElementById('contador-musicas');
    
    if (contador) contador.innerText = lista.length;
    if (!container) return;

    container.innerHTML = lista.map(m => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; border-bottom:1px solid #222;">
            <div onclick="exibirLetra('${m._id}')" style="cursor:pointer; flex-grow:1;">
                <span style="font-weight:bold; color:#fff;">${m.titulo}</span>
                <br><small style="color:#00d1b2;">${m.categoria || 'Geral'} | Tom: ${m.tom || 'N/D'}</small>
            </div>
            <button onclick="excluirMusica('${m._id}')" style="background:none; border:none; color:#ff4d4d; cursor:pointer; font-size:1.2rem;">&times;</button>
        </div>
    `).join('');
}

/**
 * EXIBIR A LETRA NO EDITOR
 */
window.exibirLetra = (id) => {
    const m = todasAsMusicas.find(x => x._id === id);
    if (!m) return;

    // Coloca os dados nos campos de cima
    document.getElementById('link-midia').value = m.link || "";
    document.getElementById('tom-musica').value = m.tom || "";

    // Monta o visual dentro do editor
    const linkBtn = m.link ? `<a href="${m.link}" target="_blank" style="background:#1DB954; color:white; padding:5px 10px; border-radius:15px; text-decoration:none; font-size:0.8rem; font-weight:bold;">📺 VÍDEO</a>` : '';
    
    const header = `
        <div id="header-dinamico" contenteditable="false" style="margin-bottom:15px; padding-bottom:10px; border-bottom:1px solid #333; display:flex; justify-content:space-between; align-items:center;">
            <span style="background:#f1c40f; color:#000; padding:4px 10px; border-radius:15px; font-weight:bold; font-size:0.8rem;">TOM: ${m.tom || 'N/D'}</span>
            ${linkBtn}
        </div>
    `;

    document.getElementById('texto-letra').innerHTML = header + m.letra;
};

/**
 * SALVAR NOVA MÚSICA (CORRIGIDO)
 */
async function salvarMusica() {
    const titulo = prompt("Título da música:");
    if (!titulo) return;

    const editor = document.getElementById('texto-letra');
    const link = document.getElementById('link-midia').value;
    const tom = document.getElementById('tom-musica').value;
    const cat = document.getElementById('select-categoria').value;

    // Limpa o cabeçalho visual antes de enviar pro banco
    const clone = editor.cloneNode(true);
    const header = clone.querySelector('#header-dinamico');
    if (header) header.remove();

    const dados = {
        titulo: titulo,
        letra: clone.innerHTML,
        categoria: cat,
        link: link,
        tom: tom
    };

    try {
        const res = await fetch(`${API_URL}/musics`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        if (res.ok) {
            alert("Música salva com sucesso! ✨");
            carregarMusicas();
            editor.innerHTML = "";
        }
    } catch (e) {
        alert("Erro ao salvar.");
    }
}

/**
 * MENSAGENS E CHAT
 */
async function carregarMensagens() {
    try {
        const res = await fetch(`${API_URL}/messages`);
        const msgs = await res.json();

        // Quadro de avisos
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
    } catch (e) { console.log("Erro no chat"); }
}

// Funções Extras (Botões HTML)
window.sair = () => { localStorage.clear(); window.location.href = 'login.html'; };
window.execCmd = (cmd, val = null) => { document.execCommand(cmd, false, val); document.getElementById('texto-letra').focus(); };
window.excluirMusica = async (id) => { if (confirm("Excluir?")) { await fetch(`${API_URL}/musics/${id}`, { method: 'DELETE' }); carregarMusicas(); } };
window.enviarChat = () => {
    const i = document.getElementById('chat-input');
    if (i.value) { 
        fetch(`${API_URL}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ texto: i.value, usuario: localStorage.getItem('usuarioLogado') })
        }).then(() => { i.value = ''; carregarMensagens(); });
    }
};
window.filtrarMusicas = () => {
    const termo = document.getElementById('input-pesquisa').value.toLowerCase();
    renderizarLista(todasAsMusicas.filter(m => m.titulo.toLowerCase().includes(termo)));
};
