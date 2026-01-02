require('dotenv').config(); 
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const Music = require('./models/Music');

const app = express();

app.use(cors({
    origin: ['https://thiagocodebr.github.io', 'http://127.0.0.1:5500', 'http://localhost:5500'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.json());

const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ MongoDB Conectado!'))
    .catch(err => console.error('❌ Erro MongoDB:', err));

// --- MODELO DE USUÁRIO ---
const Usuario = mongoose.model('Usuario', {
    nome: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    senha: { type: String, required: true }
});

// --- ROTAS DE AUTENTICAÇÃO ---
app.post('/auth/register', async (req, res) => {
    try {
        const novoUsuario = new Usuario(req.body);
        await novoUsuario.save();
        res.status(201).json({ mensagem: "Usuário criado!" });
    } catch (err) {
        res.status(400).json({ erro: "E-mail já existe!" });
    }
});

app.post('/auth/login', async (req, res) => {
    try {
        const { email, senha } = req.body;
        const usuario = await Usuario.findOne({ email, senha });
        if (usuario) {
            res.json({ nome: usuario.nome });
        } else {
            res.status(401).json({ erro: "Dados inválidos" });
        }
    } catch (err) {
        res.status(500).json({ erro: "Erro no servidor" });
    }
});

// --- ROTAS DE MÚSICAS ---
app.get('/', (req, res) => res.send('Servidor Online!'));

app.post('/musics', async (req, res) => {
    try {
        const novaMusica = new Music(req.body);
        await novaMusica.save();
        res.status(201).json(novaMusica);
    } catch (err) {
        res.status(400).json({ erro: err.message });
    }
});

app.get('/musics', async (req, res) => {
    try {
        const musicas = await Music.find().sort({ dataCriacao: -1 });
        res.json(musicas);
    } catch (err) {
        res.status(500).json({ erro: "Erro ao buscar" });
    }
});

app.delete('/musics/:id', async (req, res) => {
    try {
        await Music.findByIdAndDelete(req.params.id);
        res.json({ mensagem: "Excluído!" });
    } catch (err) {
        res.status(500).json({ erro: "Erro ao excluir" });
    }
});

// --- ROTAS DO CHAT ---
app.get('/messages', async (req, res) => {
    try {
        const mensagens = await mongoose.connection.collection('messages').find().sort({ data: 1 }).toArray();
        res.json(mensagens);
    } catch (err) { res.status(500).send(err); }
});

app.post('/messages', async (req, res) => {
    try {
        const novaMsg = { texto: req.body.texto, data: new Date() };
        await mongoose.connection.collection('messages').insertOne(novaMsg);
        res.status(201).json(novaMsg);
    } catch (err) { res.status(500).send(err); }
});

// --- INICIALIZAÇÃO ---
const PORT = process.env.PORT || 5000; 
app.listen(PORT, () => console.log(`🚀 Porta ${PORT}`));
