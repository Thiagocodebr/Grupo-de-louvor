/**
 * --- O PORTEIRO (Segurança de Acesso) ---
 * Deve vir antes de tudo para bloquear o carregamento se não houver login.
 */
if (!localStorage.getItem('usuarioLogado')) {
    window.location.href = 'login.html';
}

// 1. CONFIGURAÇÃO DA URL (Produção vs Desenvolvimento)
const API_URL = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost' 
    ? 'http://localhost:5000' 
    : 'https://grupo-de-louvor-santa-esmeralda.onrender.com';

// Variáveis Globais de Estado
let todasAsMusicas = []; 
let listaTemporariaLinks = []; 
let tituloMusicaAtual = ""; 

/**
 * 2. INICIALIZAÇÃO DO SISTEMA
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log("Sistema Santa Esmeralda v15 - Online");

    // Exibir saudação personalizada
    const nomeUsuario = localStorage.getItem('usuarioLogado');
    const boasVindasElem = document.getElementById('boas-vindas');
    if (boasVindasElem && nomeUsuario) {
        boasVindasElem.innerText = `Olá, ${nomeUsuario}! 🙏`;
    }
    
    // Cargas Iniciais
    carregarMusicas();
    carregarMensagensEChat();
    
    // Atualização em Tempo Real (Chat/Mural)
    setInterval(carregarMensagensEChat, 10000); 

    // Listeners de Botões
    document.getElementById('btn-add-link')?.addEventListener('click', adicionarLinkTemporario);
    document.getElementById('btn-salvar-letra')?.addEventListener('click', salvarLetra);
    document.getElementById('btn-gerar-pdf')?.addEventListener('click', gerarPDF);
    document.getElementById('btn-limpar-editor')?.addEventListener('click', limparEditor);
    document.getElementById('btn-enviar-chat')?.addEventListener('click', enviarChat);
    document.getElementById('btn-nova-ideia')?.addEventListener('click', sugerirIdeia);

    // Pesquisa de Repertório
    document.getElementById('input-pesquisa')?.addEventListener('input', (e) => {
        const termo = e.target.value.toLowerCase();
        const filtradas = todasAsMusicas.filter(m => m.titulo.toLowerCase().includes(termo));
        renderizarLista(filtradas);
    });
});

/**
 * 3. GESTÃO DO REPERTÓRIO
 */
async function carregarMusicas() {
    try {
        const res = await fetch(`${API_URL}/musics`);
        if (!res.ok) throw new Error("Erro na API");
        todasAsMusicas = await res.json();
        renderizarLista(todasAsMusicas);
    } catch (err) {
        console.error("Erro ao carregar repertório:", err);
        const listaDiv = document.getElementById('lista-musicas');
        if (listaDiv) listaDiv.innerHTML = "<p style='color:red; padding:10px;'>Erro ao carregar músicas.</p>";
    }
}

function renderizarLista(musicas) {
    const listaDiv = document.getElementById('lista-musicas');
    const contador = document.getElementById('contador-musicas');
    
    if (contador) contador.innerText = musicas.length;
    if (!listaDiv) return;
    
    if (!musicas.length) {
        listaDiv.innerHTML = '<p style="padding:10px; color:#666;">Nenhuma música encontrada.</p>';
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
 * 4. FUNÇÃO DE GERAÇÃO DE PDF
 */
async function gerarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const letra = document.getElementById('texto-letra').value;
    const categoria = document.getElementById('select-categoria').value;

    if (!letra.trim()) {
        alert("O editor está vazio!");
        return;
    }

    const tituloParaDocumento = tituloMusicaAtual || prompt("Título da Música:") || "Música Santa Esmeralda";

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text("GRUPO DE LOUVOR SANTA ESMERALDA", 105, 15, { align: "center" });

    doc.setFontSize(22);
    doc.setTextColor(0);
    doc.text(tituloParaDocumento.toUpperCase(), 105, 30, { align: "center" });

    doc.setFontSize(12);
    doc.setFont("helvetica", "italic");
    doc.text(`Categoria: ${categoria}`, 105, 38, { align: "center" });

    doc.setDrawColor(200);
    doc.line(20, 42, 190, 42);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    const splitText = doc.splitTextToSize(letra, 170);
    doc.text(splitText, 20, 50);

    doc.save(`${tituloParaDocumento}.pdf`);
}

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
            alert("Sucesso! Música salva.");
            limparEditor();
            carregarMusicas();
        }
    } catch (err) { alert("Erro ao salvar."); }
}

/**
 * 6. MURAL E CHAT
 */
async function carregarMensagensEChat() {
    try {
        const res = await fetch(`${API_URL}/messages`);
        const mensagens = await res.json();

        const mural = document.getElementById('mural-ideias-display');
        if (mural) {
            const ideias = mensagens.filter(m => m.texto.includes("💡"));
            mural.innerHTML = ideias.reverse().map(m => `<div><p style="margin: 0;">${m.texto}</p></div>`).join('');
        }

        const chat = document.getElementById('chat-mensagens');
        if (chat) {
            const conversas = mensagens.filter(m => !m.texto.includes("💡"));
            chat.innerHTML = conversas.map(m => `
                <div>
                    <strong style="color: #00d1b2;">Membro:</strong>
                    <p style="margin: 0; color: #eee;">${m.texto}</p>
                </div>
            `).join('');
            chat.scrollTop = chat.scrollHeight;
        }
    } catch (err) { console.error("Erro no chat"); }
}

async function enviarChat() {
    const input = document.getElementById('chat-input');
    const texto = input?.value.trim();
    if (!texto) return;
    await postarMensagem(texto);
    input.value = '';
}

async function sugerirIdeia() {
    const texto = prompt("Sugestão de música ou aviso:");
    if (texto) await postarMensagem(`💡 IDEIA: ${texto}`);
}

async function postarMensagem(texto) {
    try {
        await fetch(`${API_URL}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ texto })
        });
        carregarMensagensEChat();
    } catch (err) { console.error(err); }
}

/**
 * 7. UTILITÁRIOS E SAÍDA
 */
function renderizarLinksNaGaveta(links) {
    const gaveta = document.getElementById('lista-links-visualizacao');
    if (!gaveta) return;
    if (!links || links.length === 0) {
        gaveta.innerHTML = '<span style="color:#666; font-size:0.8rem;">Sem referências.</span>';
        return;
    }
    gaveta.innerHTML = links.map(link => `
        <a href="${link}" target="_blank">
            ${link.includes('youtube') ? '🔴 YouTube' : link.includes('spotify') ? '🟢 Spotify' : '🔗 Link'}
        </a>
    `).join('');
}

function limparEditor() {
    document.getElementById('texto-letra').value = "";
    document.getElementById('lista-links-dinamica').innerHTML = "";
    document.getElementById('lista-links-visualizacao').innerHTML = '<span style="color:#666; font-size:0.8rem;">Clique em uma música</span>';
    listaTemporariaLinks = [];
    tituloMusicaAtual = "";
}

async function excluirMusica(id) {
    if (!confirm("Excluir música?")) return;
    try {
        const res = await fetch(`${API_URL}/musics/${id}`, { method: 'DELETE' });
        if (res.ok) carregarMusicas();
    } catch (err) { console.error(err); }
}

// Tornando a função sair global para o botão HTML encontrar
window.sair = function() {
    localStorage.removeItem('usuarioLogado');
    window.location.href = 'login.html';
};
