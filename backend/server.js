require('dotenv').config(); 
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const Music = require('./models/Music');

const app = express();

// Configuração de CORS atualizada para os seus domínios
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

// --- ROTAS DE MÚSICAS ---
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

// --- ROTAS DO CHAT ---
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

const PORT = process.env.PORT || 5000; 
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
