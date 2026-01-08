/**
 * CONFIGURAÇÕES E ESTADO GLOBAL
 */
const API_URL = 'https://grupo-de-louvor-santa-esmeralda.onrender.com';
let todasAsMusicas = [];
let timerInterval = null;
const BANCO_EMOJIS = ['🙏','🎶','❤️','🙌','✨','🔥','😊','😂'];

if (!localStorage.getItem('usuarioLogado')) {
    window.location.href = 'login.html';
}

/**
 * INICIALIZAÇÃO
 */
document.addEventListener('DOMContentLoaded', async () => {
    const boasVindas = document.getElementById('boas-vindas');
    if (boasVindas) boasVindas.innerText = `Olá, ${localStorage.getItem('usuarioLogado')}!`;

    executarCarregamentoInicial();
    setInterval(() => carregarMensagensEChat().catch(() => {}), 10000);

    document.getElementById('input-pesquisa')?.addEventListener('input', filtrarMusicas);
    document.getElementById('btn-salvar-letra')?.addEventListener('click', salvarMusica);
    document.getElementById('btn-gerar-pdf')?.addEventListener('click', gerarPDF);
});

async function executarCarregamentoInicial() {
    try { await carregarMusicas(); } catch (e) { console.error("Erro Musicas:", e); }
    try { await carregarMensagensEChat(); } catch (e) { console.error("Erro Chat:", e); }
    try { carregarAgenda(); } catch (e) { console.error("Erro Agenda:", e); }
}

/**
 * LÓGICA DE CIFRAS (SISTEMA INTELIGENTE)
 */
function destacarAcordes(textoHtml) {
    const div = document.createElement('div');
    div.innerHTML = textoHtml;
    const regexAcordes = /\b([A-G][b#]?(2|4|5|6|7|9|11|13|maj7|maj9|min7|m7|m|sus2|sus4|add9|dim|aug)?(\/[A-G][b#]?)?)\b/g;

    const processarNode = (node) => {
        if (node.nodeType === 3) { 
            const span = document.createElement('span');
            span.innerHTML = node.nodeValue.replace(regexAcordes, (acorde) => {
                return `<span style="color: #f1c40f; font-weight: bold; background: rgba(241, 196, 15, 0.15); padding: 1px 4px; border-radius: 4px;">${acorde}</span>`;
            });
            node.replaceWith(...span.childNodes);
        } else {
            node.childNodes.forEach(processarNode);
        }
    };
    processarNode(div);
    return div.innerHTML;
}

/**
 * GESTÃO DE MÚSICAS (SALVAR E EXIBIR)
 */
async function carregarMusicas() {
    const res = await fetch(`${API_URL}/musics`);
    if (!res.ok) throw new Error("Erro servidor");
    todasAsMusicas = await res.json();
    renderizarLista(todasAsMusicas);
}

async function salvarMusica() {
    const titulo = prompt("Título da música:");
    if (!titulo) return;

    const editor = document.getElementById('texto-letra');
    
    // --- LIMPEZA CRÍTICA ---
    // Criamos uma cópia do texto para remover as etiquetas amarelas (TOM) antes de salvar
    const cloneEditor = editor.cloneNode(true);
    const etiquetasAmarelas = cloneEditor.querySelectorAll('[id^="header-dinamico"], .tag-tom-visual');
    etiquetasAmarelas.forEach(el => el.remove());

    const letraLimpa = cloneEditor.innerHTML; 
    const categoria = document.getElementById('select-categoria').value;
    const link = document.getElementById('link-midia').value; // Aqui pega o link do campo de cima
    const tom = document.getElementById('tom-musica').value;

    const res = await fetch(`${API_URL}/musics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            titulo: titulo, 
            letra: letraLimpa, 
            categoria: categoria, 
            link: link, 
            tom: tom 
        })
    });

    if (res.ok) {
        alert("Música salva com sucesso! ✨");
        document.getElementById('link-midia').value = "";
        document.getElementById('tom-musica').value = "";
        editor.innerHTML = "";
        carregarMusicas();
    }
}

window.exibirLetra = (id) => {
    const m = todasAsMusicas.find(x => x._id === id);
    if (!m) return;

    // 1. Atualiza os campos de edição (inputs de cima)
    document.getElementById('link-midia').value = m.link || "";
    document.getElementById('tom-musica').value = m.tom || "";

    // 2. Prepara a visualização no editor
    let letraProcessada = destacarAcordes(m.letra);

    const linkBotao = m.link ? `
        <a href="${m.link}" target="_blank" style="background:#1DB954; color:white; padding:5px 12px; border-radius:15px; text-decoration:none; font-size:0.75rem; font-weight:bold; display:flex; align-items:center; gap:5px;">
            📺 ABRIR LINK DE APOIO
        </a>` : '';

    const headerVisual = `
        <div id="header-dinamico" contenteditable="false" style="margin-bottom:20px; padding-bottom:15px; border-bottom:1px solid #444; display:flex; justify-content:space-between; align-items:center;">
            <span style="background:#f1c40f; color:#000; padding:4px 12px; border-radius:20px; font-weight:bold; font-size:0.85rem;">TOM ATUAL: ${m.tom || 'N/D'}</span>
            ${linkBotao}
        </div>
    `;
    
    document.getElementById('texto-letra').innerHTML = headerVisual + letraProcessada;
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

/**
 * REPETIR LISTAGEM E FILTROS
 */
function renderizarLista(musicas) {
    const lista = document.getElementById('lista-musicas');
    if (!lista) return;

    lista.innerHTML = musicas.map(m => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; border-bottom:1px solid #222;">
            <div onclick="exibirLetra('${m._id}')" style="cursor:pointer; flex-grow:1;">
                <span style="font-weight:500;">${m.titulo}</span>
                <br><small style="color:#00d1b2;">${m.categoria || 'Geral'} | Tom: ${m.tom || '?'}</small>
            </div>
            <button onclick="excluirMusica('${m._id}')" style="background:none; border:none; color:#ff4d4d; cursor:pointer;">&times;</button>
        </div>
    `).join('');
}

/**
 * FUNÇÕES DO CHAT E AGENDA (MANTIDAS)
 */
async function carregarMensagensEChat() {
    const res = await fetch(`${API_URL}/messages`);
    const msgs = await res.json();
    const chat = document.getElementById('chat-mensagens');
    if (chat) {
        chat.innerHTML = msgs.filter(m => !m.texto.includes("SISTEMA_") && !m.texto.includes("💡"))
            .map(m => `<p><b style="color:#00d1b2">${m.usuario}:</b> ${m.texto}</p>`).join('');
        chat.scrollTop = chat.scrollHeight;
    }
}

// Comandos de edição
window.execCmd = (comando, valor = null) => {
    document.execCommand(comando, false, valor);
    document.getElementById('texto-letra').focus();
};

window.filtrarMusicas = () => {
    const termo = document.getElementById('input-pesquisa').value.toLowerCase();
    renderizarLista(todasAsMusicas.filter(m => m.titulo.toLowerCase().includes(termo)));
};

window.excluirMusica = async (id) => {
    if (confirm("Excluir música?")) {
        await fetch(`${API_URL}/musics/${id}`, { method: 'DELETE' });
        carregarMusicas();
    }
};

// Funções de PDF e Livreto
async function gerarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const texto = document.getElementById('texto-letra').innerText;
    doc.text(doc.splitTextToSize(texto, 180), 10, 20);
    doc.save("musica.pdf");
}

window.sair = () => { localStorage.clear(); window.location.href = 'login.html'; };

function carregarAgenda() {
    const salva = localStorage.getItem('proximoEnsaio');
    if (salva) document.getElementById('data-ensaio-display').innerText = new Date(salva).toLocaleString('pt-BR');
}
