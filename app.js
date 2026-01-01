// 1. CONFIGURAÇÃO DA URL (AJUSTADA)
const API_URL = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost' 
    ? 'http://localhost:5000' 
    : 'https://grupo-de-louvor-santa-esmeralda.onrender.com';

// Variáveis Globais
let todasAsMusicas = []; 
let listaTemporariaLinks = []; 

/**
 * 2. CARREGAMENTO INICIAL
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log("Sistema Iniciado...");
    carregarMusicas();
    carregarMensagensEChat();
    
    // Atualização automática do Chat/Mural a cada 10 segundos
    setInterval(carregarMensagensEChat, 10000); 

    // Configurar Event Listeners de forma segura
    document.getElementById('btn-add-link')?.addEventListener('click', adicionarLinkTemporario);
    document.getElementById('btn-salvar-letra')?.addEventListener('click', salvarLetra);
    document.getElementById('btn-enviar-chat')?.addEventListener('click', enviarChat);
    document.getElementById('btn-nova-ideia')?.addEventListener('click', sugerirIdeia);
    document.getElementById('btn-limpar-editor')?.addEventListener('click', limparEditor);

    // Pesquisa em tempo real
    document.getElementById('input-pesquisa')?.addEventListener('input', (e) => {
        const termo = e.target.value.toLowerCase();
        const filtradas = todasAsMusicas.filter(m => m.titulo.toLowerCase().includes(termo));
        renderizarLista(filtradas);
    });
});

/**
 * 3. LÓGICA DO REPERTÓRIO
 */
async function carregarMusicas() {
    try {
        const res = await fetch(`${API_URL}/musics`);
        if (!res.ok) throw new Error("Falha ao buscar músicas");
        todasAsMusicas = await res.json();
        renderizarLista(todasAsMusicas);
    } catch (err) {
        console.error("Erro ao carregar músicas:", err);
        document.getElementById('lista-musicas').innerHTML = "<p style='color:red;'>Erro ao carregar repertório.</p>";
    }
}

function renderizarLista(musicas) {
    const listaDiv = document.getElementById('lista-musicas');
    const contador = document.getElementById('contador-musicas');
    
    if (contador) contador.innerText = musicas.length;
    
    if (!musicas.length) {
        listaDiv.innerHTML = '<p style="padding:10px;">Nenhuma música encontrada.</p>';
        return;
    }

    listaDiv.innerHTML = musicas.map(m => `
        <div class="item-musica" id="musica-${m._id}" style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #333;">
            <div onclick="exibirLetra('${m._id}')" style="cursor:pointer; flex-grow: 1;">
                <span style="font-size: 0.6rem; background: #444; color: #fff; padding: 2px 5px; border-radius: 3px; text-transform: uppercase;">
                    ${m.categoria || 'Geral'}
                </span><br>
                <strong style="color: #fff">${m.titulo}</strong>
            </div>
            <button onclick="excluirMusica('${m._id}')" style="background:none; border:none; color: #ff4d4d; cursor:pointer;">🗑️</button>
        </div>
    `).join('');
}

window.exibirLetra = (id) => {
    const musica = todasAsMusicas.find(m => m._id === id);
    if (musica) {
        document.getElementById('texto-letra').value = musica.letra || "";
        document.getElementById('select-categoria').value = musica.categoria || "Adoração";
        renderizarLinksNaGaveta(musica.links || []);
        
        document.querySelectorAll('.item-musica').forEach(i => i.classList.remove('selecionada'));
        document.getElementById(`musica-${id}`)?.classList.add('selecionada');
    }
};

/**
 * 4. LÓGICA DE SALVAMENTO
 */
function adicionarLinkTemporario() {
    const input = document.getElementById('link-referencia');
    const url = input.value.trim();
    if (url) {
        listaTemporariaLinks.push(url);
        renderizarLinksTemporarios();
        input.value = '';
    }
}

function renderizarLinksTemporarios() {
    const div = document.getElementById('lista-links-dinamica');
    div.innerHTML = listaTemporariaLinks.map((link, index) => `
        <div style="display:flex; justify-content:space-between; background:#111; padding:5px; border-radius:4px; font-size:0.8rem;">
            <span style="color:#00d1b2; overflow:hidden;">${link}</span>
            <button onclick="listaTemporariaLinks.splice(${index},1); renderizarLinksTemporarios();" style="color:red; background:none; border:none; cursor:pointer;">✕</button>
        </div>
    `).join('');
}

async function salvarLetra() {
    const titulo = prompt("Nome da música:");
    if (!titulo) return;

    const novaMusica = {
        titulo: titulo,
        artista: "Grupo Santa Esmeralda",
        categoria: document.getElementById('select-categoria').value,
        letra: document.getElementById('texto-letra').value,
        links: listaTemporariaLinks
    };

    try {
        const res = await fetch(`${API_URL}/musics`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(novaMusica)
        });

        if (res.ok) {
            alert("Música salva com sucesso!");
            limparEditor();
            carregarMusicas();
        }
    } catch (err) { alert("Erro ao salvar música."); }
}

/**
 * 5. MURAL E CHAT (SEPARADOS)
 */
async function carregarMensagensEChat() {
    try {
        const res = await fetch(`${API_URL}/messages`);
        const mensagens = await res.json();

        // Mural (com 💡)
        const mural = document.getElementById('mural-ideias-display');
        const ideias = mensagens.filter(m => m.texto.includes("💡"));
        mural.innerHTML = ideias.map(m => `
            <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px; margin-bottom: 10px; border-left: 3px solid #f1c40f;">
                <p style="margin: 0; color: white; font-size: 0.85rem;">${m.texto}</p>
            </div>
        `).join('');

        // Chat (sem 💡)
        const chat = document.getElementById('chat-mensagens');
        const conversas = mensagens.filter(m => !m.texto.includes("💡"));
        chat.innerHTML = conversas.map(m => `
            <div style="margin-bottom: 8px;">
                <strong style="color: #00d1b2; font-size: 0.75rem;">Membro:</strong>
                <p style="margin: 0; color: #eee; font-size: 0.9rem;">${m.texto}</p>
            </div>
        `).join('');
        chat.scrollTop = chat.scrollHeight;

    } catch (err) { console.error("Erro nas mensagens."); }
}

async function enviarChat() {
    const input = document.getElementById('chat-input');
    const texto = input.value.trim();
    if (!texto) return;
    
    await postarMensagem(texto);
    input.value = '';
}

async function sugerirIdeia() {
    const texto = prompt("Sua sugestão de música ou ideia:");
    if (!texto) return;
    await postarMensagem(`💡 IDEIA: ${texto}`);
}

async function postarMensagem(texto) {
    try {
        await fetch(`${API_URL}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ texto })
        });
        carregarMensagensEChat();
    } catch (err) { console.error("Erro ao enviar mensagem."); }
}

/**
 * AUXILIARES
 */
function renderizarLinksNaGaveta(links) {
    const gaveta = document.getElementById('lista-links-visualizacao');
    if (!links.length) {
        gaveta.innerHTML = '<span style="color:#666; font-size:0.8rem;">Sem links.</span>';
        return;
    }
    gaveta.innerHTML = links.map(link => `
        <a href="${link}" target="_blank" style="background:#333; color:#fff; padding:4px 10px; border-radius:15px; text-decoration:none; font-size:0.7rem; border:1px solid #555;">
            ${link.includes('youtube') ? '🔴 YouTube' : '🟢 Spotify'}
        </a>
    `).join('');
}

function limparEditor() {
    document.getElementById('texto-letra').value = "";
    document.getElementById('lista-links-dinamica').innerHTML = "";
    document.getElementById('lista-links-visualizacao').innerHTML = '<span style="color:#666; font-size:0.8rem;">Clique em uma música para ver os links</span>';
    listaTemporariaLinks = [];
}

async function excluirMusica(id) {
    if (!confirm("Excluir esta música?")) return;
    try {
        await fetch(`${API_URL}/musics/${id}`, { method: 'DELETE' });
        carregarMusicas();
    } catch (err) { console.error(err); }
}
