/**
 * LÓGICA UNIFICADA DE MURAL E CHAT
 */
async function carregarMensagensEChat() {
    try {
        const res = await fetch(`${API_URL}/messages`);
        const todasAsMensagens = await res.json();

        // 1. Filtrar e renderizar o MURAL (Tudo que começa com 💡)
        const muralDisplay = document.getElementById('mural-ideias-display');
        const ideias = todasAsMensagens.filter(m => m.texto.includes("💡"));
        muralDisplay.innerHTML = ideias.map(m => `
            <div style="background: rgba(255,255,255,0.05); padding: 8px; border-radius: 5px; margin-bottom: 8px; border-left: 3px solid #f1c40f;">
                <p style="margin: 0; color: white; font-size: 0.85rem;">${m.texto}</p>
                <small style="color: #666; font-size: 0.7rem;">${new Date(m.data).toLocaleDateString()}</small>
            </div>
        `).join('');

        // 2. Filtrar e renderizar o CHAT (Tudo que NÃO tem 💡)
        const chatDisplay = document.getElementById('chat-mensagens');
        const conversas = todasAsMensagens.filter(m => !m.texto.includes("💡"));
        chatDisplay.innerHTML = conversas.map(m => `
            <div style="margin-bottom: 10px;">
                <strong style="color: #00d1b2; font-size: 0.75rem;">Membro:</strong>
                <p style="margin: 2px 0; color: #eee; font-size: 0.9rem;">${m.texto}</p>
            </div>
        `).join('');
        
        // Auto-scroll para o final do chat
        chatDisplay.scrollTop = chatDisplay.scrollHeight;

    } catch (err) { console.error("Erro ao carregar interações:", err); }
}

// Enviar conversa normal
async function enviarChat() {
    const texto = chatInput.value.trim();
    if (!texto) return;
    await postarMensagem(texto);
    chatInput.value = '';
}

// Enviar Ideia (Adiciona o emoji automaticamente)
async function sugerirIdeia() {
    const ideia = prompt("Qual sua ideia ou sugestão de música?");
    if (!ideia) return;
    await postarMensagem(`💡 IDEIA: ${ideia}`);
}

// Função auxiliar para o POST
async function postarMensagem(texto) {
    try {
        await fetch(`${API_URL}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ texto })
        });
        carregarMensagensEChat();
    } catch (err) { console.error("Erro ao postar:", err); }
}
