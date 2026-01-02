/**
 * 1. CONFIGURAÇÕES E SEGURANÇA
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

// Emojis expandidos
const BANCO_EMOJIS = ['🙏','🎶','❤️','🙌','✨','🔥','😊','😂','😮','😢','👏','🎸','🎹','🎤','🌟','☁️'];

/**
 * 2. INICIALIZAÇÃO E EVENTOS
 */
document.addEventListener('DOMContentLoaded', () => {
    const nomeUsuario = localStorage.getItem('usuarioLogado');
    const boasVindasElem = document.getElementById('boas-vindas');
    if (boasVindasElem && nomeUsuario) boasVindasElem.innerText = `Olá, ${nomeUsuario}! 🙏`;
    
    carregarMusicas();
    carregarMensagensEChat();
    
    setInterval(() => carregarMensagensEChat(), 10000); 

    // Listeners principais
    document.getElementById('btn-add-link')?.addEventListener('click', adicionarLinkTemporario);
    document.getElementById('btn-salvar-letra')?.addEventListener('click', salvarLetra);
    document.getElementById('btn-gerar-pdf')?.addEventListener('click', gerarPDF);
    document.getElementById('btn-limpar-editor')?.addEventListener('click', limparEditor);
    document.getElementById('btn-enviar-chat')?.addEventListener('click', enviarChat);
    document.getElementById('btn-nova-ideia')?.addEventListener('click', sugerirIdeia);

    // Fechar seletores de emoji ao clicar fora
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.emoji-container')) {
            document.querySelectorAll('.emoji-picker').forEach(p => p.style.display = 'none');
        }
    });

    document.getElementById('input-pesquisa')?.addEventListener('input', (e) => {
        const termo = e.target.value.toLowerCase();
        renderizarLista(todasAsMusicas.filter(m => m.titulo.toLowerCase().includes(termo)));
    });
});

/**
 * 3. SISTEMA DE EMOJIS (SELETOR)
 */
window.toggleEmojiPicker = function(id) {
    const picker = document.getElementById(id);
    if (!picker) return;
    
    if (picker.innerHTML === "") {
        picker.innerHTML = BANCO_EMOJIS.map(emoji => 
            `<span onclick="colarEmoji('${emoji}', '${id}')">${emoji}</span>`
        ).join('');
    }
    picker.style.display = picker.style.display === 'flex' ? 'none' : 'flex';
};

window.colarEmoji = function(emoji, pickerId) {
    if (pickerId === 'picker-editor') {
        const editor = document.getElementById('texto-letra');
        editor.focus();
        document.execCommand('insertText', false, emoji);
    } else {
        const input = document.getElementById('chat-input');
        input.value += emoji;
        input.focus();
    }
    document.getElementById(pickerId).style.display = 'none';
};

/**
 * 4. COMUNICAÇÃO (CHAT E MURAL)
 */
async function carregarMensagensEChat() {
    const chat = document.getElementById('chat-mensagens');
    const mural = document.getElementById('mural-ideias-display');

    try {
        const res = await fetch(`${API_URL}/messages`);
        const mensagens = await res.json();
        
        if (chat) {
            chat.innerHTML = mensagens.filter(m => !m.texto.includes("💡"))
                .map(m => `<p style="margin-bottom:8px;"><b style="color:#00d1b2">${m.usuario || 'Membro'}:</b> ${m.texto}</p>`).join('');
            chat.scrollTop = chat.scrollHeight;
        }

        if (mural) {
            // .slice(0, 10) mantém apenas as 10 mensagens mais recentes visíveis
            mural.innerHTML = mensagens.filter(m => m.texto.includes("💡")).reverse().slice(0, 10)
                .map(m => `
                    <div class="card-ideia" style="position:relative; padding:10px; border-bottom:1px solid #333; background:rgba(255,255,255,0.03); margin-bottom:5px; border-radius:5px;">
                        <button onclick="excluirItemMural('${m._id}')" style="position:absolute; right:8px; top:8px; background:none; border:none; color:#ff4d4d; cursor:pointer; font-size:1rem;">&times;</button>
                        <span style="display:block; padding-right:20px;">${m.texto}</span>
                        <small style="color:#f1c40f;">Enviado por: ${m.usuario || 'Membro'}</small>
                    </div>
                `).join('');
        }
    } catch (err) { console.warn("Erro ao carregar mensagens."); }
}

window.excluirItemMural = async function(id) {
    if (!confirm("Remover esta ideia do mural?")) return;
    try {
        const res = await fetch(`${API_URL}/messages/${id}`, { method: 'DELETE' });
        if (res.ok) carregarMensagensEChat();
    } catch (e) { alert("Erro ao excluir."); }
};

async function enviarChat() {
    const input = document.getElementById('chat-input');
    const texto = input?.value.trim();
    if (!texto) return;

    await fetch(`${API_URL}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto, usuario: localStorage.getItem('usuarioLogado') })
    });
    input.value = '';
    carregarMensagensEChat();
}

/**
 * 5. GESTÃO DE MÚSICAS E EDITOR
 */
async function carregarMusicas() {
    const listaDiv = document.getElementById('lista-musicas');
    try {
        const res = await fetch(`${API_URL}/musics`);
        todasAsMusicas = await res.json();
        renderizarLista(todasAsMusicas);
    } catch (err) {
        if (listaDiv) listaDiv.innerHTML = "<p>Servidor carregando...</p>";
    }
}

function renderizarLista(musicas) {
    const listaDiv = document.getElementById('lista-musicas');
    if (!listaDiv) return;
    document.getElementById('contador-musicas').innerText = musicas.length;
    
    listaDiv.innerHTML = musicas.map(m => `
        <div class="item-musica" style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #333;">
            <div onclick="exibirLetra('${m._id}')" style="cursor:pointer; flex-grow:1;">
                <span style="font-size: 0.6rem; background: #00d1b2; color: #000; padding: 2px 5px; border-radius: 3px; font-weight:bold;">${m.categoria || 'Geral'}</span><br>
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
    }
};

window.execCmd = (command, value = null) => {
    document.execCommand(command, false, value);
    document.getElementById('texto-letra').focus();
};

async function salvarLetra() {
    const titulo = prompt("Título da música:", tituloMusicaAtual);
    if (!titulo) return;
    const dados = {
        titulo,
        categoria: document.getElementById('select-categoria').value,
        letra: document.getElementById('texto-letra').innerHTML,
        links: listaTemporariaLinks
    };
    await fetch(`${API_URL}/musics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
    });
    alert("Salvo!");
    carregarMusicas();
}

async function gerarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const letraLimpa = document.getElementById('texto-letra').innerText;
    doc.setFontSize(16);
    doc.text(tituloMusicaAtual || "Música", 10, 20);
    doc.setFontSize(12);
    doc.text(doc.splitTextToSize(letraLimpa, 180), 10, 30);
    doc.save(`${tituloMusicaAtual || 'letra'}.pdf`);
}

function adicionarLinkTemporario() {
    const input = document.getElementById('link-referencia');
    if (input?.value.trim()) {
        listaTemporariaLinks.push(input.value.trim());
        renderizarLinksTemporarios();
        input.value = '';
    }
}

function renderizarLinksTemporarios() {
    document.getElementById('lista-links-dinamica').innerHTML = listaTemporariaLinks.map((l, i) => `
        <div style="display:flex; justify-content:space-between; background:#222; padding:5px; margin-top:5px; border-radius:4px;">
            <span style="font-size:0.8rem; color:#00d1b2; overflow:hidden;">${l}</span>
            <button onclick="listaTemporariaLinks.splice(${i},1); renderizarLinksTemporarios();" style="border:none; background:none; color:red; cursor:pointer;">&times;</button>
        </div>
    `).join('');
}

function renderizarLinksNaGaveta(links) {
    document.getElementById('lista-links-visualizacao').innerHTML = links.map(l => `<a href="${l}" target="_blank" style="color:#00d1b2; font-size:0.8rem;">🔗 Link</a>`).join('');
}

function limparEditor() {
    document.getElementById('texto-letra').innerHTML = "";
    listaTemporariaLinks = [];
    tituloMusicaAtual = "";
}

async function excluirMusica(id) {
    if (confirm("Excluir música?")) {
        await fetch(`${API_URL}/musics/${id}`, { method: 'DELETE' });
        carregarMusicas();
    }
}

async function sugerirIdeia() {
    const texto = prompt("Sua ideia:");
    if (!texto) return;
    await fetch(`${API_URL}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto: `💡 IDEIA: ${texto}`, usuario: localStorage.getItem('usuarioLogado') })
    });
    carregarMensagensEChat();
}

window.sair = () => {
    localStorage.removeItem('usuarioLogado');
    window.location.href = 'login.html';
};
