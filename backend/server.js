require('dotenv').config(); 
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const Music = require('./models/Music');

const app = express();

<<<<<<< HEAD
=======
// Configuração de CORS atualizada para os seus domínios
>>>>>>> b43a564e185e58cfaac5de8fe6f3a990f3241d48
app.use(cors({
    origin: ['https://thiagocodebr.github.io', 'http://127.0.0.1:5500', 'http://localhost:5500'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.json());

const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ MongoDB Conectado com Sucesso!'))
    .catch(err => console.error('❌ Erro ao conectar ao MongoDB:', err));

// --- 1. DEFINIÇÃO DO MODELO DE USUÁRIO ---
// (Sempre antes das rotas que o utilizam)
const Usuario = mongoose.model('Usuario', {
    nome: String,
    email: { type: String, unique: true },
    senha: String
});

// --- 2. ROTAS DE AUTENTICAÇÃO ---
app.post('/auth/register', async (req, res) => {
    try {
        const novoUsuario = new Usuario(req.body);
        await novoUsuario.save();
        res.json({ mensagem: "Usuário criado!" });
    } catch (err) {
        res.status(400).json({ erro: "E-mail já existe!" });
    }
});

app.post('/auth/login', async (req, res) => {
    const { email, senha } = req.body;
    const usuario = await Usuario.findOne({ email, senha });
    if (usuario) {
        res.json({ nome: usuario.nome });
    } else {
        res.status(401).json({ erro: "Dados inválidos" });
    }
});

// --- 3. ROTAS DE MÚSICAS ---
app.get('/', (req, res) => {
    res.send('Servidor do Grupo de Louvor está Online!');
});

// Rota POST atualizada para receber links
app.post('/musics', async (req, res) => {
    try {
        const novaMusica = new Music(req.body);
        await novaMusica.save();
        res.status(201).json({ mensagem: "✅ Música e Links salvos!", dados: novaMusica });
    } catch (err) {
        res.status(400).json({ mensagem: "❌ Erro ao salvar", erro: err.message });
    }
});

app.get('/musics', async (req, res) => {
    try {
        const musicas = await Music.find().sort({ dataCriacao: -1 });
        res.json(musicas);
    } catch (err) {
        res.status(500).json({ mensagem: "❌ Erro ao buscar" });
    }
});

app.delete('/musics/:id', async (req, res) => {
    try {
        await Music.findByIdAndDelete(req.params.id);
        res.json({ mensagem: "Música excluída com sucesso!" });
    } catch (err) {
        res.status(500).json({ mensagem: "Erro ao excluir." });
    }
});

// --- 4. ROTAS DO CHAT ---
app.get('/messages', async (req, res) => {
    try {
        const mensagens = await mongoose.connection.collection('messages').find().sort({ data: 1 }).limit(50).toArray();
        res.json(mensagens);
    } catch (err) { res.status(500).send(err); }
});

app.post('/messages', async (req, res) => {
    try {
        const novaMsg = { texto: req.body.texto, usuario: "Membro", data: new Date() };
        await mongoose.connection.collection('messages').insertOne(novaMsg);
        res.status(201).json(novaMsg);
    } catch (err) { res.status(500).send(err); }
});

<<<<<<< HEAD
// --- 5. INICIALIZAÇÃO DO SERVIDOR ---
=======
>>>>>>> b43a564e185e58cfaac5de8fe6f3a990f3241d48
const PORT = process.env.PORT || 5000; 
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
