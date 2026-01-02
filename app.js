/**
 * 1. PORTEIRO DE SEGURANÇA E CONFIGURAÇÃO
 */
if (!localStorage.getItem('usuarioLogado')) {
    window.location.href = 'login.html';
}

const API_URL = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost' 
    ? 'http://localhost:5000' 
    : 'https://grupo-de-louvor-santa-esmeralda.onrender.com';

let todasAsMusicas = []; 
let listaTemporariaLinks = []; 
let tituloMusicaAtual = ""; 

/**
 * 2. INICIALIZAÇÃO DO SISTEMA
 */
document.addEventListener('DOMContentLoaded', () => {
    const nomeUsuario = localStorage.getItem('usuarioLogado');
    const boasVindasElem = document.getElementById('boas-vindas');
    if (boasVindasElem && nomeUsuario) {
        boasVindasElem.innerText = `Olá, ${nomeUsuario}! 🙏`;
    }
    
    carregarMusicas();
    carregarMensagensEChat();
    setInterval(carregarMensagensEChat, 10000); 

    // Listeners de Botões
    document.getElementById('btn-add-link')?.addEventListener('click', adicionarLinkTemporario);
    document.getElementById('btn-salvar-letra')?.addEventListener('click', salvarLetra);
    document.getElementById('btn-gerar-pdf')?.addEventListener('click', gerarPDF);
    document.getElementById('btn-limpar-editor')?.addEventListener('click', limparEditor);
    document.getElementById('btn-enviar-chat')?.addEventListener('click', enviarChat);
    document.getElementById('btn-nova-ideia')?.addEventListener('click', sugerirIdeia);

    // Pesquisa Dinâmica
    document.getElementById('input-pesquisa')?.addEventListener('input', (e) => {
        const termo = e.target.value.toLowerCase();
        const filtradas = todasAsMusicas.filter(m => m.titulo.toLowerCase().includes(termo));
        renderizarLista(filtradas);
    });
});

/**
 * 3. FERRAMENTAS DO EDITOR (Rich Text & Emojis)
 */
window.execCmd = function(command, value = null) {
    document.execCommand(command, false, value);
    document.getElementById('texto-letra').focus();
};

window.inserirEmojiEditor = function(emoji) {
    const editor = document.getElementById('texto-letra');
    editor.focus();
    document.execCommand('insertText', false, emoji);
};

window.adicionarEmojiChat = function(emoji) {
    const input = document.getElementById('chat-input');
    input.value += emoji;
    input.focus();
};

/**
 * 4. GESTÃO DO REPERTÓRIO
 */
async function carregarMusicas() {
    const listaDiv = document.getElementById('lista-musicas');
    try {
        const res = await fetch(`${API_URL}/musics`);
        todasAsMusicas = await res.json();
        renderizarLista(todasAsMusicas);
    } catch (err) {
        if (listaDiv) listaDiv.innerHTML = "<p style='color:#ffa502;'>O servidor está acordando... aguarde 30s.</p>";
    }
}

function renderizarLista(musicas) {
    const listaDiv = document.getElementById('lista-musicas');
    const contador = document.getElementById('contador-musicas');
    if (contador) contador.innerText = musicas.length;
    if (!listaDiv) return;
    
    listaDiv.innerHTML = musicas.map(m => `
        <div class="item-musica" id="musica-${m._id}" style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #333;">
            <div onclick="exibirLetra('${m._id}')" style="cursor:pointer; flex-grow: 1;">
                <span style="font-size: 0.6rem; background: #00d1b2; color: #000; padding: 2px 5px; border-radius: 3px; text-transform: uppercase; font-weight:bold;">
                    ${m.categoria || 'Geral'}
                </span><br>
                <strong style="color: #fff">${m.titulo}</strong>
            </div>
            <button onclick="excluirMusica('${m._id}')" style="background:none; border:none; color: #ff4d4d; cursor:pointer; font-size:1.2rem;">&times;</button>
        </div>
    `).join('');
}

window.exibirLetra = (id) => {
    const musica = todasAsMusicas.find(m => m._id === id);
    if (musica) {
        tituloMusicaAtual = musica.titulo; 
        document.getElementById('texto-letra').innerHTML = musica.letra || "";
        document.getElementById('select-categoria').value = musica.categoria || "Adoração";
        renderizarLinksNaGaveta(musica.links || []);
        
        document.querySelectorAll('.item-musica').forEach(i => i.style.background = "transparent");
        const item = document.getElementById(`musica-${id}`);
        if (item) item.style.background = "rgba(0, 209, 178, 0.1)";
    }
};

/**
 * 5. SALVAMENTO E UTILITÁRIOS
 */
async function salvarLetra() {
    const titulo = prompt("Título da música:", tituloMusicaAtual);
    if (!titulo) return;

    const dados = {
        titulo,
        categoria: document.getElementById('select-categoria').value,
        letra: document.getElementById('texto-letra').innerHTML, // Salva formatação HTML
        links: listaTemporariaLinks
    };

    try {
        const res = await fetch(`${API_URL}/musics`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });
        if (res.ok) {
            alert("Música salva com sucesso! 🙌");
            limparEditor();
            carregarMusicas();
        }
    } catch (err) { alert("Erro ao salvar."); }
}

async function gerarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const editor = document.getElementById('texto-letra');
    
    // Converte HTML para texto simples para o PDF não bugar
    const letraLimpa = editor.innerText;

    doc.setFont("helvetica", "bold");
    doc.text(tituloMusicaAtual || "Nova Música", 10, 20);
    doc.setFont("helvetica", "normal");
    doc.text(doc.splitTextToSize(letraLimpa, 180), 10, 30);
    doc.save(`${tituloMusicaAtual || 'musica'}.pdf`);
}

/**
 * 6. CHAT E MURAL
 */
async function carregarMensagensEChat() {
    try {
        const res = await fetch(`${API_URL}/messages`);
        const mensagens = await res.json();
        
        const chat = document.getElementById('chat-mensagens');
        if (chat) {
            chat.innerHTML = mensagens.filter(m => !m.texto.includes("💡"))
                .map(m => `<p style="margin-bottom:8px;"><b style="color:#00d1b2">${m.usuario || 'Membro'}:</b> ${m.texto}</p>`).join('');
            chat.scrollTop = chat.scrollHeight;
        }

        const mural = document.getElementById('mural-ideias-display');
        if (mural) {
            mural.innerHTML = mensagens.filter(m => m.texto.includes("💡")).reverse()
                .map(m => `<div style="padding:8px; border-bottom:1px solid #333; font-size:0.9rem;">${m.texto}<br><small style="color:#f1c40f;">Por: ${m.usuario || 'Membro'}</small></div>`).join('');
        }
    } catch (err) { }
}

async function enviarChat() {
    const input = document.getElementById('chat-input');
    const texto = input.value.trim();
    if (!texto) return;
    await fetch(`${API_URL}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto, usuario: localStorage.getItem('usuarioLogado') || "Membro" })
    });
    input.value = '';
    carregarMensagensEChat();
}

/**
 * 7. OUTRAS FUNÇÕES
 */
function adicionarLinkTemporario() {
    const input = document.getElementById('link-referencia');
    if (input?.value.trim()) {
        listaTemporariaLinks.push(input.value.trim());
        renderizarLinksTemporarios();
        input.value = '';
    }
}

function renderizarLinksTemporarios() {
    const div = document.getElementById('lista-links-dinamica');
    if (!div) return;
    div.innerHTML = listaTemporariaLinks.map((link, index) => `
        <div style="display:flex; justify-content:space-between; background:rgba(0,209,178,0.1); padding:8px; border-radius:4px; font-size:0.8rem; border:1px solid #00d1b2; margin-bottom:5px;">
            <span style="color:#fff;">${link}</span>
            <button onclick="listaTemporariaLinks.splice(${index},1); renderizarLinksTemporarios();" style="color:#ff4d4d; background:none; border:none; cursor:pointer;">✕</button>
        </div>
    `).join('');
}

function renderizarLinksNaGaveta(links) {
    const gaveta = document.getElementById('lista-links-visualizacao');
    if (!gaveta) return;
    gaveta.innerHTML = links && links.length > 0 
        ? links.map(link => `<a href="${link}" target="_blank" style="color:#00d1b2; margin-right:10px; font-size:0.8rem;">🔗 Link</a>`).join('')
        : '<span style="color:#666; font-size:0.8rem;">Sem links.</span>';
}

function limparEditor() {
    document.getElementById('texto-letra').innerHTML = "";
    document.getElementById('lista-links-dinamica').innerHTML = "";
    listaTemporariaLinks = [];
    tituloMusicaAtual = "";
}

async function excluirMusica(id) {
    if (!confirm("Excluir música permanentemente?")) return;
    await fetch(`${API_URL}/musics/${id}`, { method: 'DELETE' });
    carregarMusicas();
}

async function sugerirIdeia() {
    const texto = prompt("Sua sugestão de música ou ideia:");
    if (!texto) return;
    await fetch(`${API_URL}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto: `💡 IDEIA: ${texto}`, usuario: localStorage.getItem('usuarioLogado') || "Membro" })
    });
    carregarMensagensEChat();
}

window.sair = function() {
    localStorage.removeItem('usuarioLogado');
    window.location.href = 'login.html';
};
