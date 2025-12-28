const mongoose = require('mongoose');

const MusicSchema = new mongoose.Schema({
    titulo: { type: String, required: true },
    artista: { type: String, default: 'Grupo Santa Esmeralda' },
    categoria: { type: String, default: 'Adoração' },
    letra: { type: String, default: '' }, // Agora não é mais obrigatório!
    links: [String], // <-- Esta linha permite salvar a lista de links do YouTube/Spotify
    dataCriacao: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Music', MusicSchema);
