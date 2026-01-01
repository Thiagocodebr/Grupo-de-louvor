// 1. CONFIGURAÇÃO DA URL
const API_URL = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost' 
    ? 'http://localhost:5000' 
    : 'https://grupo-de-louvor-santa-esmeralda.onrender.com';

/**
 * 2. ELEMENTOS DO DOM
 */
const areaEditorLetra = document.getElementById('texto-letra');
const listaMusicasDiv = document.getElementById('lista-musicas');
const inputPesquisa = document.getElementById('input-pesquisa');
const contadorMusicas = document.getElementById('contador-musicas');
const muralIdeiasDisplay = document.getElementById('chat-mensagens');
const chatInput = document.getElementById('chat-input');
const selectCategoria = document.getElementById('select-categoria');

// Elementos para os Links (Entrada e Visualização)
const inputLink = document.getElementById('link-referencia');
const listaLinksDinamica = document.getElementById('lista-links-dinamica'); // Onde você vê enquanto adiciona
const gavetaLinksVisualizacao = document.getElementById('lista-links-visualizacao'); // Onde os links salvos aparecem

let todasAsMusicas = []; 
let listaTemporariaLinks = []; 

/**
 * 3. LÓGICA DE MÚSICAS E EXIBIÇÃO
 */
function obterCorCategoria(categoria) {
    const cores = { 
        'Adoração': '#3498db', 'Celebração': '#f1c40f', 
        'Santa Ceia': '#e74c3c', 'Missão': '#e67e22', 'Especial': '#9b59b6' 
    };
    return cores[categoria] || '#7f8c8d';
}

function renderizarLista(musicas) {
    if (contadorMusicas) contadorMusicas.innerText = musicas.length;
    if (!musicas.length) {
        listaMusicasDiv.innerHTML = '<p style="padding:10px;">Nenhuma música encontrada.</p>';
        return;
    }

    listaMusicasDiv.innerHTML = musicas.map(m => `
        <div class="item-musica" id="musica-${m._id}" style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #333;">
            <div onclick="exibirLetra('${m._id}')" style="cursor:pointer; flex-grow: 1;">
                <span style="font-size: 0.65rem; background: ${obterCorCategoria(m.categoria)}; color: white; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; font-weight: bold;">
                    ${m.categoria || 'Geral'}
                </span><br>
                <strong style="color: #fff">${m.titulo}</strong>
            </div>
            <button onclick="excluirMusica('${m._id}')" style="background:none; border:none; color: #ff4d4d; cursor:pointer; font-size: 1.1rem;">🗑️</button>
        </div>
    `).join('');
}

async function carregarMusicas() {
    try {
        const res = await fetch(`${API_URL}/musics`);
        todasAsMusicas = await res.json();
        renderizarLista(todasAsMusicas);
    } catch (err) { console.error("Erro ao carregar músicas:", err); }
}

// ATUALIZADO: Mostra links na gaveta e limpa o editor
window.exibirLetra = (id) => {
    const musica = todasAsMusicas.find(m => m._id === id);
    if (musica) {
        areaEditorLetra.value = musica.letra || "";
        if (selectCategoria) selectCategoria.value = musica.categoria || "Adoração";

        // Preenche a gaveta de links superior
        renderizarLinksNaGaveta(musica.links || []);

        document.querySelectorAll('.item-musica').forEach(i => i.classList.remove('selecionada'));
        document.getElementById(`musica-${id}`)?.classList.add('selecionada');
    }
};

function renderizarLinksNaGaveta(links) {
    if (!gavetaLinksVisualizacao) return;
    
    if (links.length === 0) {
        gavetaLinksVisualizacao.innerHTML = '<span style="color: #666; font-size: 0.8rem;">Sem referências salvas.</span>';
        return;
    }

    gavetaLinksVisualizacao.innerHTML = links.map(link => {
        let label = link.includes('youtube') || link.includes('youtu.be') ? '🔴 YouTube' : '🟢 Spotify';
        if (!link.includes('youtube') && !link.includes('spotify')) label = '🔗 Link';
        
        return `
            <a href="${link}" target="_blank" style="background: #333; color: #fff; padding: 5px 12px; border-radius: 20px; text-decoration: none; font-size: 0.75rem; border: 1px solid #444; display: flex; align-items: center; gap: 5px;">
                ${label}
            </a>
        `;
    }).join('');
}

/**
 * 4. SALVAMENTO (Título, Categoria, Letra e Links)
 */
async function salvarLetra() {
    const titulo = prompt("Digite o nome da música:");
    if (!titulo) return;

    const novaMusica = {
        titulo: titulo,
        artista: "Grupo Santa Esmeralda",
        categoria: selectCategoria.value,
        letra: areaEditorLetra.value.trim(),
        links: listaTemporariaLinks // Os links que você adicionou no painel esquerdo
    };

    try {
        const res = await fetch(`${API_URL}/musics`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(novaMusica)
        });

        if (res.ok) {
            alert("Música salva com sucesso!");
            areaEditorLetra.value = "";
            listaTemporariaLinks = [];
            renderizarLinksTemporarios();
            carregarMusicas();
        }
    } catch (err) { console.error("Erro ao salvar:", err); }
}

/**
 * 5. MURAL DE IDEIAS
 */
async function carregarMural() {
    try {
        const res = await fetch(`${API_URL}/messages`);
        const mensagens = await res.json();
        if (muralIdeiasDisplay) {
            muralIdeiasDisplay.innerHTML = mensagens.map(m => `
                <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px; margin-bottom: 10px; border-left: 3px solid #f1c40f;">
                    <strong style="color: #f1c40f; font-size: 0.7rem;">💡 IDEIA - ${new Date(m.data).toLocaleDateString()}:</strong>
                    <p style="margin: 5px 0; color: white; font-size: 0.9rem;">${m.texto}</p>
                </div>
            `).join('');
            muralIdeiasDisplay.scrollTop = muralIdeiasDisplay.scrollHeight;
        }
    } catch (err) { console.error("Erro no mural:", err); }
}

async function postarIdeia() {
    const texto = chatInput.value.trim();
    if (!texto) return;
    try {
        await fetch(`${API_URL}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ texto })
        });
        chatInput.value = '';
        carregarMural();
    } catch (err) { console.error("Erro ao postar ideia:", err); }
}

/**
 * 6. LINKS TEMPORÁRIOS (Enquanto cria a música)
 */
function renderizarLinksTemporarios() {
    if (!listaLinksDinamica) return;
    listaLinksDinamica.innerHTML = listaTemporariaLinks.map((link, index) => `
        <div style="display: flex; justify-content: space-between; background: #1a1a1a; padding: 5px 10px; border-radius: 5px; font-size: 0.8rem; border: 1px solid #333;">
            <span style="color: #00d1b2; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 180px;">${link}</span>
            <button onclick="removerLinkTemporario(${index})" style="background:none; border:none; color:#ff4d4d; cursor:pointer;">✕</button>
        </div>
    `).join('');
}

window.removerLinkTemporario = (index) => {
    listaTemporariaLinks.splice(index, 1);
    renderizarLinksTemporarios();
};

/**
 * 7. INICIALIZAÇÃO
 */
document.addEventListener('DOMContentLoaded', () => {
    carregarMusicas();
    carregarMural();
    setInterval(carregarMural, 10000); 

    document.getElementById('btn-add-link')?.addEventListener('click', () => {
        const url = inputLink.value.trim();
        if (url) {
            listaTemporariaLinks.push(url);
            renderizarLinksTemporarios();
            inputLink.value = '';
        }
    });

    document.getElementById('btn-salvar-letra')?.addEventListener('click', salvarLetra);
    document.getElementById('btn-enviar-chat')?.addEventListener('click', postarIdeia);
    document.getElementById('btn-nova-ideia')?.addEventListener('click', () => chatInput.focus());

    inputPesquisa?.addEventListener('input', (e) => {
        const termo = e.target.value.toLowerCase();
        const filtradas = todasAsMusicas.filter(m => m.titulo.toLowerCase().includes(termo));
        renderizarLista(filtradas);
    });

    document.getElementById('btn-limpar-editor')?.addEventListener('click', () => {
        areaEditorLetra.value = "";
        listaTemporariaLinks = [];
        renderizarLinksTemporarios();
        if (gavetaLinksVisualizacao) gavetaLinksVisualizacao.innerHTML = '';
    });
});
