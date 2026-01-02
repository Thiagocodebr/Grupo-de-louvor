const API_URL = "https://grupo-de-louvor-santa-esmeralda.onrender.com"; // Sua URL do Render

async function realizarLogin() {
    const email = document.getElementById('login-email').value;
    const senha = document.getElementById('login-senha').value;

    const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
    });

    if (res.ok) {
        const data = await res.json();
        localStorage.setItem('usuarioLogado', data.nome); // Guarda o nome do usuário
        window.location.href = "index.html"; // Vai para a página principal
    } else {
        alert("E-mail ou senha incorretos!");
    }
}

async function finalizarCadastro() {
    const nome = document.getElementById('cad-nome').value;
    const email = document.getElementById('cad-email').value;
    const senha = document.getElementById('cad-senha').value;

    const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, senha })
    });

    if (res.ok) {
        alert("Cadastrado com sucesso! Faça seu login.");
        location.reload();
    } else {
        alert("Erro ao cadastrar.");
    }
}

// Torna as funções acessíveis pelo HTML
window.realizarLogin = realizarLogin;
window.finalizarCadastro = finalizarCadastro;
