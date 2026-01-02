require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const cron = require('node-cron'); // Importante instalar: npm install node-cron
const Music = require('./models/Music');

const app = express();

// --- CONFIGURAÇÃO ---
app.use(cors({
    origin: ['https://thiagocodebr.github.io', 'http://127.0.0.1:5500', 'http://localhost:5500', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// --- CONEXÃO MONGODB ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB Conectado!'))
    .catch(err => console.error('❌ Erro MongoDB:', err));

// --- MODELOS (SCHEMAS) ---
const Usuario = mongoose.model('Usuario', {
    nome: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    senha: { type: String, required: true }
});

const Message = mongoose.model('Message', {
    texto: { type: String, required: true },
    usuario: { type: String, required: true },
    data: { type: Date, default: Date.now }
});

// --- AUTOMAÇÃO: LIMPEZA DO MURAL ---
// Roda todo dia à meia-noite (00:00) e apaga mensagens com mais de 7 dias
cron.schedule('0 0 * * *', async () => {
    try {
        const limiteData = new Date();
        limiteData.setDate(limiteData.getDate() - 7);
        const resultado = await Message.deleteMany({ data: { $lt: limiteData } });
        console.log(`🧹 Faxina concluída: ${resultado.deletedCount} mensagens antigas removidas.`);
    } catch (err) {
        console.error("❌ Erro na limpeza automática:", err);
    }
});

// --- ROTAS DE AUTENTICAÇÃO ---
app.post('/auth/register', async (req, res) => {
    try {
        const novoUsuario = new Usuario(req.body);
        await novoUsuario.save();
        res.status(201).json({ mensagem: "Usuário criado!" });
    } catch (err) { res.status(400).json({ erro: "E-mail já existe!" }); }
});

app.post('/auth/login', async (req, res) => {
    try {
        const { email, senha } = req.body;
        const usuario = await Usuario.findOne({ email, senha });
        usuario ? res.json({ nome: usuario.nome }) : res.status(401).json({ erro: "Dados inválidos" });
    } catch (err) { res.status(500).json({ erro: "Erro no servidor" }); }
});

// --- ROTAS DE MÚSICAS ---
app.get('/musics', async (req, res) => {
    try {
        const musicas = await Music.find().sort({ dataCriacao: -1 });
        res.json(musicas);
    } catch (err) { res.status(500).json({ erro: "Erro ao buscar" }); }
});

app.post('/musics', async (req, res) => {
    try {
        const novaMusica = new Music(req.body);
        await novaMusica.save();
        res.status(201).json(novaMusica);
    } catch (err) { res.status(400).json({ erro: err.message }); }
});

app.delete('/musics/:id', async (req, res) => {
    try {
        await Music.findByIdAndDelete(req.params.id);
        res.json({ mensagem: "Música excluída!" });
    } catch (err) { res.status(500).json({ erro: "Erro ao excluir" }); }
});

// --- ROTAS DO CHAT E MURAL ---
app.get('/messages', async (req, res) => {
    try {
        const mensagens = await Message.find().sort({ data: 1 });
        res.json(mensagens);
    } catch (err) { res.status(500).json(err); }
});

app.post('/messages', async (req, res) => {
    try {
        const novaMsg = new Message({
            texto: req.body.texto,
            usuario: req.body.usuario,
            data: new Date()
        });
        await novaMsg.save();
        res.status(201).json(novaMsg);
    } catch (err) { res.status(500).json(err); }
});

// NOVA ROTA: Excluir mensagem individual (Mural)
app.delete('/messages/:id', async (req, res) => {
    try {
        await Message.findByIdAndDelete(req.params.id);
        res.json({ mensagem: "Mensagem removida!" });
    } catch (err) { res.status(500).json({ erro: "Erro ao remover" }); }
});

// --- INICIALIZAÇÃO ---
app.get('/', (req, res) => res.send('Servidor Santa Esmeralda Online! 🎶'));
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
