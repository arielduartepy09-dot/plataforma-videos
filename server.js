require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// Aumentamos el límite del body para permitir miniaturas en Base64 pesadas
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());

// ==========================================
// ARCHIVOS ESTÁTICOS (Frontend)
// ==========================================
app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Conexión a MongoDB Atlas
const MONGO_URI = "mongodb+srv://arielduartepy09_db_user:Ariel1993@cluster0.bfhn8ch.mongodb.net/Prueba";

mongoose.connect(MONGO_URI)
  .then(() => console.log('¡Conectado exitosamente a MongoDB Atlas!'))
  .catch(err => console.error('Error al conectar a MongoDB:', err));

// ==========================================
// RUTA DE INICIO DE SESIÓN
// ==========================================
app.post('/api/login', (req, res) => {
  try {
    const { password } = req.body;
    const PASSWORD_ADMIN = 'Ariel1811';

    if (password === PASSWORD_ADMIN) {
      return res.json({ exito: true, mensaje: 'Acceso autorizado' });
    } else {
      return res.json({ exito: false, mensaje: 'Contraseña incorrecta' });
    }
  } catch (error) {
    console.error('Error en el login:', error);
    return res.status(500).json({ exito: false, mensaje: 'Error interno en el servidor' });
  }
});

// ==========================================
// ESQUEMA Y MODELO DE VIDEO
// ==========================================
const videoSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  descripcion: { type: String },
  categoria: { type: String },
  urlVideo: { type: String, required: true },
  urlPortada: { type: String },
  vistas: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  fechaCreacion: { type: Date, default: Date.now }
});

const Video = mongoose.model('Video', videoSchema);

// ==========================================
// RUTAS DE GESTIÓN DE VIDEOS
// ==========================================

app.post('/api/videos', async (req, res) => {
  try {
    const nuevoVideo = new Video(req.body);
    await nuevoVideo.save();
    res.status(201).json({ mensaje: '¡Video guardado exitosamente!', video: nuevoVideo });
  } catch (error) {
    console.error('Error al guardar el video:', error);
    res.status(500).json({ error: 'Error interno al guardar el video en la base de datos' });
  }
});

app.get('/api/videos', async (req, res) => {
  try {
    const videos = await Video.find().sort({ fechaCreacion: -1 });
    res.json(videos);
  } catch (error) {
    console.error('Error al obtener los videos:', error);
    res.status(500).json({ error: 'Error al obtener los videos' });
  }
});

app.delete('/api/videos/:id', async (req, res) => {
  try {
    await Video.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Video eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar el video:', error);
    res.status(500).json({ error: 'Error al eliminar el video' });
  }
});

app.put('/api/videos/:id/vista', async (req, res) => {
  try {
    const video = await Video.findByIdAndUpdate(
      req.params.id,
      { $inc: { vistas: 1 } },
      { new: true }
    );
    if (!video) return res.status(404).json({ error: 'Video no encontrado' });
    res.json({ exito: true, vistas: video.vistas });
  } catch (error) {
    console.error('Error al actualizar vistas:', error);
    res.status(500).json({ error: 'Error al actualizar vistas' });
  }
});

app.put('/api/videos/:id/like', async (req, res) => {
  const { accion } = req.body;
  const incremento = accion === 'sumar' ? 1 : -1;

  try {
    const video = await Video.findByIdAndUpdate(
      req.params.id,
      { $inc: { likes: incremento } },
      { new: true }
    );
    if (!video) return res.status(404).json({ error: 'Video no encontrado' });
    res.json({ exito: true, likes: video.likes });
  } catch (error) {
    console.error('Error al actualizar likes:', error);
    res.status(500).json({ error: 'Error al actualizar likes' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});