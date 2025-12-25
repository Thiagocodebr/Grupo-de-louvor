const mongoose = require('mongoose');

const MusicSchema = new mongoose.Schema({
    titulo: { type: String, required: true },
    artista: { type: String, required: true },
    letra: { type: String, required: true },
    categoria: { type: String, default: 'Louvor' }, // Ex: Adoração, Celebração
    dataCriacao: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Music', MusicSchema);