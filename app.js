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

const BANCO_EMOJIS = ['🙏','🎶','❤️','🙌','✨','🔥','😊','😂','😮','😢','👏','🎸','🎹','🎤','🌟','☁️'];

/**
 * 2. INICIALIZAÇÃO E EVENTOS
 */
document.addEventListener('DOMContentLoaded', () => {
    const nomeUsuario = localStorage.getItem('usuarioLogado');
    const boasVindasElem = document.getElementById('boas-vindas');
    if (boasVindasElem && nomeUsuario) boasVindasElem.innerText = `Olá, ${nomeUsuario}! 🙏`;
    
    // Inicializar dados
    carregarMusicas();
    carregarMensagensEChat();
    carregarAgenda(); 
    carregarQuadroAvisos(); // Inicializa o Quadro de Avisos
    
    // Atualização em tempo real (10s)
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

    // Pesquisa de músicas
    document.getElementById('input-pesquisa')?.addEventListener('input', (e) => {
        const termo = e.target.value.toLowerCase();
        renderizarLista(todasAsMusicas.filter(m => m.titulo.toLowerCase().includes(termo)));
    });
});

/**
 * 3. SISTEMA DE EMOJIS
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
 * 4. COMUNICAÇÃO (CHAT, MURAL, AGENDA E QUADRO DE AVISOS)
 */

// --- QUADRO DE AVISOS (NOVO) ---
async function carregarQuadroAvisos() {
    const display = document.getElementById('quadro-avisos-display');
    try {
        const res = await fetch(`${API_URL}/messages`);
        const mensagens = await res.json();
        
        // Filtra a mensagem mais recente que contém a "tag" de quadro de avisos
        const ultimoAviso = mensagens
            .filter(m => m.texto.startsWith("SISTEMA_QUADRO:"))
            .reverse()[0];

        if (display) {
            display.innerText = ultimoAviso 
                ? ultimoAviso.texto.replace("SISTEMA_QUADRO:", "") 
                : "Nenhum aviso importante no momento. 👐";
        }
    } catch (err) { console.warn("Erro ao carregar avisos."); }
}

window.editarQuadroAvisos = async function() {
    const display = document.getElementById('quadro-avisos-display');
    const novoAviso = prompt("Digite o novo aviso oficial:", display.innerText);
    
    if (novoAviso !== null && novoAviso.trim() !== "") {
        await enviarMensagemAoServidor(`SISTEMA_QUADRO:${novoAviso}`, "LIDERANÇA");
        carregarQuadroAvisos();
    }
};

// --- AGENDA DE ENSAIOS ---
function carregarAgenda() {
    const dataSalva = localStorage.getItem('proximoEnsaio') || "Não definido";
    const display = document.getElementById('data-ensaio-display');
    if (display) display.innerText = dataSalva;
}

window.definirNovoEnsaio = function() {
    const novaData = prompt("Digite a data e hora do ensaio (ex: Terça, 20h):");
    if (novaData) {
        localStorage.setItem('proximoEnsaio', novaData);
        carregarAgenda();
        const usuario = localStorage.getItem('usuarioLogado');
        enviarMensagemAoServidor(`📅 NOVO ENSAIO: ${novaData}`, usuario);
    }
};

// --- CHAT E MURAL ---
async function carregarMensagensEChat() {
    const chat = document.getElementById('chat-mensagens');
    const mural = document.getElementById('mural-ideias-display');

    try {
        const res = await fetch(`${API_URL}/messages`);
        const mensagens = await res.json();
        
        // Atualiza Quadro de Avisos silenciosamente junto com o chat
        carregarQuadroAvisos();

        if (chat) {
            // Filtra: Esconde ideias (💡) E mensagens do sistema de quadro (SISTEMA_QUADRO:)
            chat.innerHTML = mensagens.filter(m => !m.texto.includes("💡") && !m.texto.startsWith("SISTEMA_QUADRO:"))
                .map(m => `<p style="margin-bottom:8px;"><b style="color:#00d1b2">${m.usuario || 'Membro'}:</b> ${m.texto}</p>`).join('');
            chat.scrollTop = chat.scrollHeight;
        }

        if (mural) {
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

async function enviarMensagemAoServidor(texto, usuario) {
    await fetch(`${API_URL}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto, usuario })
    });
    carregarMensagensEChat();
}

async function enviarChat() {
    const input = document.getElementById('chat-input');
    const texto = input?.value.trim();
    if (!texto) return;
    await enviarMensagemAoServidor(texto, localStorage.getItem('usuarioLogado'));
    input.value = '';
}

async function sugerirIdeia() {
    const texto = prompt("Sua ideia para o grupo:");
    if (!texto) return;
    await enviarMensagemAoServidor(`💡 IDEIA: ${texto}`, localStorage.getItem('usuarioLogado'));
}

window.excluirItemMural = async function(id) {
    if (!confirm("Remover esta ideia do mural?")) return;
    try {
        const res = await fetch(`${API_URL}/messages/${id}`, { method: 'DELETE' });
        if (res.ok) carregarMensagensEChat();
    } catch (e) { alert("Erro ao excluir."); }
};

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
        if (listaDiv) listaDiv.innerHTML = "<p>Conectando ao servidor...</p>";
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
        window.scrollTo({ top: 0, behavior: 'smooth' });
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
    alert("Música salva com sucesso!");
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
    if(confirm("Limpar todo o editor?")) {
        document.getElementById('texto-letra').innerHTML = "";
        listaTemporariaLinks = [];
        tituloMusicaAtual = "";
        document.getElementById('lista-links-visualizacao').innerHTML = "";
    }
}

async function excluirMusica(id) {
    if (confirm("Excluir música permanentemente?")) {
        await fetch(`${API_URL}/musics/${id}`, { method: 'DELETE' });
        carregarMusicas();
    }
}

window.sair = () => {
    localStorage.removeItem('usuarioLogado');
    window.location.href = 'login.html';
};
