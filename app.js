/**
 * 1. EXIBIR MÚSICA (Letra limpa + Links na Gaveta)
 */
window.exibirLetra = (id) => {
    const musica = todasAsMusicas.find(m => m._id === id);
    if (musica) {
        // 1. Joga a letra pura no editor
        areaEditorLetra.value = musica.letra || "";
        
        // 2. Limpa e preenche a gaveta de links superior
        const gaveta = document.getElementById('lista-links-visualizacao');
        listaTemporariaLinks = musica.links || [];
        
        if (listaTemporariaLinks.length > 0) {
            gaveta.innerHTML = listaTemporariaLinks.map(link => `
                <a href="${link}" target="_blank" class="botao-link-referencia">
                    ${link.includes('youtube') ? '🔴 YouTube' : '🟢 Spotify'}
                </a>
            `).join('');
        } else {
            gaveta.innerHTML = '<span style="color:#555; font-size:0.8rem;">Sem referências salvas.</span>';
        }

        // Destaque na lista lateral
        document.querySelectorAll('.item-musica').forEach(i => i.classList.remove('selecionada'));
        document.getElementById(`musica-${id}`)?.classList.add('selecionada');
    }
};

/**
 * 2. SALVAR (Pergunta a Categoria no Prompt para não poluir o editor)
 */
async function salvarLetra() {
    const titulo = prompt("Nome da música:");
    if (!titulo) return;

    // Pergunta a categoria apenas no salvamento
    const categoria = prompt("Categoria (Adoração, Celebração, Santa Ceia):", "Adoração");

    const novaMusica = {
        titulo: titulo,
        artista: "Grupo Santa Esmeralda",
        categoria: categoria || "Adoração",
        letra: areaEditorLetra.value, // Letra limpa
        links: listaTemporariaLinks
    };

    const res = await fetch(`${API_URL}/musics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novaMusica)
    });

    if (res.ok) {
        alert("Salvo com sucesso!");
        carregarMusicas();
    }
}

/**
 * 3. MURAL DE IDEIAS (Filtra apenas o que é ideia)
 */
async function carregarMuralIdeias() {
    const res = await fetch(`${API_URL}/messages`);
    const dados = await res.json();
    
    // Filtra para mostrar apenas mensagens que começam com "💡 IDEIA:"
    const mural = document.getElementById('mural-ideias-display');
    mural.innerHTML = dados
        .filter(m => m.texto.includes("💡 IDEIA:"))
        .map(m => `
            <div class="card-ideia">
                <small>${new Date(m.data).toLocaleDateString()}</small>
                <p>${m.texto.replace("💡 IDEIA:", "")}</p>
            </div>
        `).join('');
}
