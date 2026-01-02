/**
 * 1. PORTEIRO DE SEGURANÇA
 * Bloqueia o acesso antes de qualquer outra coisa carregar.
 */
if (!localStorage.getItem('usuarioLogado')) {
    window.location.href = 'login.html';
}

/**
 * 2. CONFIGURAÇÃO DA URL
 * Corrigido para usar === e garantir conexão estável.
 */
const API_URL = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost' 
    ? 'http://localhost:5000' 
    : 'https://grupo-de-louvor-santa-esmeralda.onrender.com';

// Variáveis Globais de Estado
let todasAsMusicas = []; 
let listaTemporariaLinks = []; 
let tituloMusicaAtual = ""; 

/**
 * 3. INICIALIZAÇÃO DO SISTEMA
 */
document.addEventListener('DOMContentLoaded', () => {
    // Exibir saudação
    const nomeUsuario = localStorage.getItem('usuarioLogado');
    const boasVindasElem = document.getElementById('boas-vindas');
    if (boasVindasElem && nomeUsuario) {
        boasVindasElem.innerText = `Olá, ${nomeUsuario}! 🙏`;
    }
    
    // Iniciar carregamento
    carregarMusicas();
    carregarMensagensEChat();
    
    // Atualização automática
    setInterval(carregarMensagensEChat, 10000); 

    // Configurar botões (com proteção contra erros)
    document.getElementById('btn-add-link')?.addEventListener('click', adicionarLinkTemporario);
    document.getElementById('btn-salvar-letra')?.addEventListener('click', salvarLetra);
    document.getElementById('btn-gerar-pdf')?.addEventListener('click', gerarPDF);
    document.getElementById('btn-limpar-editor')?.addEventListener('click', limparEditor);
    document.getElementById('btn-enviar-chat')?.addEventListener('click', enviarChat);
    document.getElementById('btn-nova-ideia')?.addEventListener('click', sugerirIdeia);

    // Pesquisa
    document.getElementById('input-pesquisa')?.addEventListener('input', (e) => {
        const termo = e.target.value.toLowerCase();
        const filtradas = todasAsMusicas.filter(m => m.titulo.toLowerCase().includes(termo));
        renderizarLista(filtradas);
    });
});

/**
 * 4. FUNÇÕES DO REPERTÓRIO
 */
async function carregarMusicas() {
    const listaDiv = document.getElementById('lista-musicas');
    try {
        const res = await fetch(`${API_URL}/musics`);
        if (!res.ok) throw new Error("Erro na resposta da rede");
        todasAsMusicas = await res.json();
        renderizarLista(todasAsMusicas);
    } catch (err) {
        console.error("Erro ao carregar músicas:", err);
        if (listaDiv) listaDiv.innerHTML = "<p style='color:#ffa502;'>O servidor está acordando... aguarde 30 segundos e atualize a página.</p>";
    }
}

function renderizarLista(musicas) {
    const listaDiv = document.getElementById('lista-musicas');
    const contador = document.getElementById('contador-musicas');
    if (contador) contador.innerText = musicas.length;
    if (!listaDiv) return;
    
    if (musicas.length === 0) {
        listaDiv.innerHTML = '<p style="padding:10px; color:#666;">Nenhuma música cadastrada ainda.</p>';
        return;
    }

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
        document.getElementById('texto-letra').value = musica.letra || "";
        document.getElementById('select-categoria').value = musica.categoria || "Adoração";
        renderizarLinksNaGaveta(musica.links || []);
        
        document.querySelectorAll('.item-musica').forEach(i => i.style.background = "transparent");
        const itemSelecionado = document.getElementById(`musica-${id}`);
        if (itemSelecionado) itemSelecionado.style.background = "rgba(0, 209, 178, 0.1)";
    }
};

/**
 * 5. SALVAMENTO E LINKS
 */
function adicionarLinkTemporario() {
    const input = document.getElementById('link-referencia');
    const url = input?.value.trim();
    if (url) {
        listaTemporariaLinks.push(url);
        renderizarLinksTemporarios();
        input.value = '';
    }
}

function renderizarLinksTemporarios() {
    const div = document.getElementById('lista-links-dinamica');
    if (!div) return;
    div.innerHTML = listaTemporariaLinks.map((link, index) => `
        <div style="display:flex; justify-content:space-between; background:rgba(0,209,178,0.1); padding:8px; border-radius:4px; font-size:0.8rem; border:1px solid #00d1b2;">
            <span style="color:#fff; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${link}</span>
            <button onclick="listaTemporariaLinks.splice(${index},1); renderizarLinksTemporarios();" style="color:#ff4d4d; background:none; border:none; cursor:pointer; font-weight:bold;">✕</button>
        </div>
    `).join('');
}

async function salvarLetra() {
    const titulo = prompt("Título da música:", tituloMusicaAtual);
    if (!titulo) return;

    const dados = {
        titulo,
        artista: "Grupo Santa Esmeralda",
        categoria: document.getElementById('select-categoria').value,
        letra: document.getElementById('texto-letra').value,
        links: listaTemporariaLinks
    };

    try {
        const res = await fetch(`${API_URL}/musics`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        if (res.ok) {
            alert("Música salva com sucesso!");
            limparEditor();
            carregarMusicas();
        }
    } catch (err) { alert("Erro ao salvar."); }
}

/**
 * 6. PDF E UTILITÁRIOS
 */
async function gerarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const letra = document.getElementById('texto-letra').value;
    if (!letra.trim()) return alert("Editor vazio!");

    doc.setFont("helvetica", "bold");
    doc.text(tituloMusicaAtual || "Nova Música", 10, 20);
    doc.setFont("helvetica", "normal");
    const splitText = doc.splitTextToSize(letra, 180);
    doc.text(splitText, 10, 30);
    doc.save(`${tituloMusicaAtual || 'musica'}.pdf`);
}

function renderizarLinksNaGaveta(links) {
    const gaveta = document.getElementById('lista-links-visualizacao');
    if (!gaveta) return;
    gaveta.innerHTML = links && links.length > 0 
        ? links.map(link => `<a href="${link}" target="_blank" style="color:#00d1b2; margin-right:10px;">🔗 Link</a>`).join('')
        : '<span style="color:#666;">Sem links.</span>';
}

function limparEditor() {
    document.getElementById('texto-letra').value = "";
    document.getElementById('lista-links-dinamica').innerHTML = "";
    listaTemporariaLinks = [];
    tituloMusicaAtual = "";
}

async function excluirMusica(id) {
    if (!confirm("Excluir música?")) return;
    try {
        await fetch(`${API_URL}/musics/${id}`, { method: 'DELETE' });
        carregarMusicas();
    } catch (err) { console.error(err); }
}

/**
 * 7. CHAT E MURAL
 */
async function carregarMensagensEChat() {
    try {
        const res = await fetch(`${API_URL}/messages`);
        const mensagens = await res.json();

        const mural = document.getElementById('mural-ideias-display');
        if (mural) {
            const ideias = mensagens.filter(m => m.texto.includes("💡"));
            mural.innerHTML = ideias.reverse().map(m => `<div style="padding:5px; border-bottom:1px solid #333;">${m.texto}</div>`).join('');
        }

        const chat = document.getElementById('chat-mensagens');
        if (chat) {
            const conversas = mensagens.filter(m => !m.texto.includes("💡"));
            chat.innerHTML = conversas.map(m => `<p><b style="color:#00d1b2">Membro:</b> ${m.texto}</p>`).join('');
            chat.scrollTop = chat.scrollHeight;
        }
    } catch (err) { }
}

async function enviarChat() {
    const input = document.getElementById('chat-input');
    const texto = input.value.trim();
    if (!texto) return;
    try {
        await fetch(`${API_URL}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ texto })
        });
        input.value = '';
        carregarMensagensEChat();
    } catch (err) { }
}

async function sugerirIdeia() {
    const texto = prompt("Sua sugestão:");
    if (!texto) return;
    try {
        await fetch(`${API_URL}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ texto: `💡 IDEIA: ${texto}` })
        });
        carregarMensagensEChat();
    } catch (err) { }
}

window.sair = function() {
    localStorage.removeItem('usuarioLogado');
    window.location.href = 'login.html';
};
