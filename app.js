/**
 * CONFIGURAÇÕES E ESTADO GLOBAL
 */
const API_URL = 'https://grupo-de-louvor-santa-esmeralda.onrender.com';
let todasAsMusicas = [];
let timerInterval = null;
const BANCO_EMOJIS = ['🙏','🎶','❤️','🙌','✨','🔥','😊','😂'];

// Proteção de Login imediata
if (!localStorage.getItem('usuarioLogado')) {
    window.location.href = 'login.html';
}

/**
 * INICIALIZAÇÃO DO SISTEMA
 */
document.addEventListener('DOMContentLoaded', async () => {
    const boasVindas = document.getElementById('boas-vindas');
    if (boasVindas) boasVindas.innerText = `Olá, ${localStorage.getItem('usuarioLogado')}!`;

    executarCarregamentoInicial();
    
    // Polling de Mensagens/Chat (10s)
    setInterval(() => carregarMensagensEChat().catch(() => {}), 10000);

    // Event Listeners
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
 * LÓGICA DE CIFRAS E ACORDES (SISTEMA INTELIGENTE)
 */
function destacarAcordes(textoHtml) {
    // Regex para identificar acordes (Ex: C, G7, Am, D/F#)
    // Evita substituir acordes dentro de tags HTML usando um parser temporário
    const div = document.createElement('div');
    div.innerHTML = textoHtml;

    const regexAcordes = /\b([A-G][b#]?(2|4|5|6|7|9|11|13|maj7|maj9|min7|m7|m|sus2|sus4|add9|dim|aug)?(\/[A-G][b#]?)?)\b/g;

    // Função recursiva para processar apenas nós de texto
    const processarNode = (node) => {
        if (node.nodeType === 3) { // Nó de texto
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
 * EDITOR E COMANDOS FORMATADOS
 */
window.execCmd = (comando, valor = null) => {
    document.execCommand(comando, false, valor);
    document.getElementById('texto-letra').focus(); // Garante que o foco volte ao editor
};

/**
 * GESTÃO DE MÚSICAS E REPERTÓRIO
 */
async function carregarMusicas() {
    const res = await fetch(`${API_URL}/musics`);
    if (!res.ok) throw new Error("Erro servidor");
    todasAsMusicas = await res.json();
    renderizarLista(todasAsMusicas);
}

function renderizarLista(musicas) {
    const lista = document.getElementById('lista-musicas');
    const contador = document.getElementById('contador-musicas');
    if (contador) contador.innerText = musicas.length;
    if (!lista) return;

    lista.innerHTML = musicas.length === 0 
        ? '<p style="padding:15px; color:#888;">Nenhuma música encontrada.</p>'
        : musicas.map(m => `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; border-bottom:1px solid #222;">
                <div onclick="exibirLetra('${m._id}')" style="cursor:pointer; flex-grow:1;">
                    <span style="font-weight:500;">${m.titulo}</span>
                    <br><small style="color:#00d1b2; font-size:0.7rem;">${m.categoria || 'Geral'} ${m.tom ? ' | Tom: '+m.tom : ''}</small>
                </div>
                <button onclick="excluirMusica('${m._id}')" style="background:none; border:none; color:#ff4d4d; cursor:pointer; font-size:1.2rem;">&times;</button>
            </div>
        `).join('');
}

async function salvarMusica() {
    const titulo = prompt("Título da música:");
    const letra = document.getElementById('texto-letra').innerHTML;
    const categoria = document.getElementById('select-categoria').value;
    const link = document.getElementById('link-midia').value;
    const tom = document.getElementById('tom-musica').value;

    if (!titulo || !letra) return alert("Preencha título e letra!");

    const res = await fetch(`${API_URL}/musics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo, letra, categoria, link, tom })
    });

    if (res.ok) {
        alert("Música salva com sucesso! ✨");
        carregarMusicas();
    }
}

window.exibirLetra = (id) => {
    const m = todasAsMusicas.find(x => x._id === id);
    if (!m) return;

    let letraExibicao = destacarAcordes(m.letra);

    const header = `
        <div style="margin-bottom:20px; padding-bottom:15px; border-bottom:1px solid #333; display:flex; justify-content:space-between; align-items:center;">
            <span style="background:#f1c40f; color:#000; padding:4px 12px; border-radius:20px; font-weight:bold; font-size:0.85rem;">TOM: ${m.tom || 'N/D'}</span>
            ${m.link ? `<a href="${m.link}" target="_blank" style="color:#1DB954; font-weight:bold; font-size:0.8rem; text-decoration:none;">📺 ABRIR VÍDEO</a>` : ''}
        </div>
    `;
    
    document.getElementById('texto-letra').innerHTML = header + letraExibicao;
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

/**
 * CHAT E COMUNIDADE
 */
async function carregarMensagensEChat() {
    const res = await fetch(`${API_URL}/messages`);
    const msgs = await res.json();
    
    // Quadro de Avisos
    const aviso = msgs.filter(m => m.texto.startsWith("SISTEMA_QUADRO:")).reverse()[0];
    const qDisplay = document.getElementById('quadro-avisos-display');
    if (qDisplay) qDisplay.innerText = aviso ? aviso.texto.split(':')[1] : "Sem avisos.";

    // Chat
    const chat = document.getElementById('chat-mensagens');
    if (chat) {
        chat.innerHTML = msgs.filter(m => !m.texto.includes("SISTEMA_") && !m.texto.includes("💡"))
            .map(m => `<p><b style="color:#00d1b2">${m.usuario}:</b> ${m.texto}</p>`).join('');
        chat.scrollTop = chat.scrollHeight;
    }
}

/**
 * AGENDA E UTILITÁRIOS
 */
function carregarAgenda() {
    const salva = localStorage.getItem('proximoEnsaio');
    const display = document.getElementById('data-ensaio-display');
    if (salva && display) {
        display.innerText = new Date(salva).toLocaleString('pt-BR');
        atualizarCronometro(salva);
    }
}

function atualizarCronometro(dataDestino) {
    const display = document.getElementById('countdown-timer');
    const container = document.getElementById('countdown-container');
    if (timerInterval) clearInterval(timerInterval);

    timerInterval = setInterval(() => {
        const diff = new Date(dataDestino).getTime() - new Date().getTime();
        if (diff <= 0) { display.innerText = "É HOJE! 🔥"; return; }
        const d = Math.floor(diff / 86400000);
        const h = Math.floor((diff % 86400000) / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        display.innerText = `${d}d ${h}h ${m}m`;
        container.style.display = 'block';
    }, 1000);
}

window.enviarChat = () => {
    const i = document.getElementById('chat-input');
    if (i.value) { enviarMensagem(i.value, localStorage.getItem('usuarioLogado')); i.value = ''; }
};

async function enviarMensagem(texto, usuario) {
    await fetch(`${API_URL}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto, usuario })
    });
    carregarMensagensEChat();
}

window.sair = () => { localStorage.clear(); window.location.href = 'login.html'; };

async function gerarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const titulo = "Letra - Santa Esmeralda";
    const texto = document.getElementById('texto-letra').innerText;
    doc.setFontSize(16);
    doc.text(titulo, 10, 10);
    doc.setFontSize(12);
    // Quebra o texto para não sair da folha
    const splitText = doc.splitTextToSize(texto, 180);
    doc.text(splitText, 10, 25);
    doc.save("musica.pdf");
}

// Funções de interface restantes (Quadro, Vaquinha, etc) permanecem as mesmas
window.filtrarMusicas = filtrarMusicas;
window.copiarPix = () => { navigator.clipboard.writeText(document.getElementById('chave-pix-texto').innerText); alert("Copiado!"); };
window.definirNovoEnsaio = () => {
    const input = prompt("Data (AAAA-MM-DD HH:MM):", "2026-01-31 19:30");
    if (input) { localStorage.setItem('proximoEnsaio', input); carregarAgenda(); enviarMensagem(`📅 NOVO ENSAIO: ${input}`, localStorage.getItem('usuarioLogado')); }
};
window.excluirMusica = async (id) => { if (confirm("Excluir?")) { await fetch(`${API_URL}/musics/${id}`, { method: 'DELETE' }); carregarMusicas(); } };
window.toggleEmojiPicker = (id) => {
    const p = document.getElementById(id);
    p.innerHTML = BANCO_EMOJIS.map(e => `<span onclick="document.getElementById('texto-letra').innerHTML+='${e}'" style="cursor:pointer; padding:5px; font-size:1.2rem;">${e}</span>`).join('');
    p.style.display = p.style.display === 'flex' ? 'none' : 'flex';
};

async function gerarLivretoCompleto() {
    if (todasAsMusicas.length === 0) return alert("Nenhuma música para gerar o livreto!");
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let y = 40;

    // 1. CAPA
    doc.setFontSize(22);
    doc.setTextColor(0, 209, 178); // Cor do Santa Esmeralda
    doc.text("LIVRETO DE LOUVOR", 105, 80, { align: "center" });
    doc.setFontSize(14);
    doc.setTextColor(100);
    doc.text("Grupo Santa Esmeralda", 105, 95, { align: "center" });
    doc.text(`Data: ${new Date().toLocaleDateString()}`, 105, 110, { align: "center" });

    // 2. ÍNDICE
    doc.addPage();
    doc.setFontSize(18);
    doc.setTextColor(0);
    doc.text("ÍNDICE", 10, 20);
    doc.setFontSize(10);
    
    // Ordenar músicas por título
    const musicasOrdenadas = [...todasAsMusicas].sort((a, b) => a.titulo.localeCompare(b.titulo));

    musicasOrdenadas.forEach((m, index) => {
        if (index > 0 && index % 40 === 0) doc.addPage(); // Nova página para o índice se for muito longo
        doc.text(`${m.titulo} (${m.tom || 'N/D'})`, 15, 30 + (index % 40) * 6);
    });

    // 3. MÚSICAS (Uma por página)
    musicasOrdenadas.forEach((m) => {
        doc.addPage();
        
        // Título e Tom
        doc.setFontSize(16);
        doc.setTextColor(0, 0, 0);
        doc.text(m.titulo.toUpperCase(), 10, 20);
        
        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text(`TOM: ${m.tom || 'Não informado'} | Categoria: ${m.categoria || 'Geral'}`, 10, 28);
        
        // Letra
        doc.setFontSize(11);
        doc.setTextColor(50);
        
        // Limpar tags HTML da letra para o PDF e quebrar linhas
        const textoLimpo = m.letra.replace(/<[^>]*>?/gm, ''); // Remove tags HTML
        const splitText = doc.splitTextToSize(textoLimpo, 180);
        
        doc.text(splitText, 10, 40);
        
        // Rodapé com número da página
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(8);
        doc.text(`Página ${pageCount}`, 105, 285, { align: "center" });
    });

    doc.save("Livreto_Santa_Esmeralda.pdf");
}
