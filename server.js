require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const path = require('path'); // <-- Necesario para manejar las rutas de los archivos HTML

const app = express();
app.use(express.json());
app.use(cors());

// ==========================================
// ARCHIVOS ESTÁTICOS (Frontend)
// ==========================================
// Esto le dice a Express que sirva index.html, admin.html, etc., desde la raíz
app.use(express.static(__dirname));

// Ruta principal para que abra index.html automáticamente al entrar a la URL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Conexión a tu base de datos en MongoDB Atlas apuntando a la base de datos "Prueba"
const MONGO_URI = "mongodb+srv://arielduartepy09_db_user:Ariel1993@cluster0.bfhn8ch.mongodb.net/Prueba";

mongoose.connect(MONGO_URI)
  .then(() => console.log('¡Conectado exitosamente a MongoDB Atlas!'))
  .catch(err => console.error('Error al conectar a MongoDB:', err));

// Esquema y Modelo de Administrador
const adminSchema = new mongoose.Schema({
  usuario: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true }
});
const Admin = mongoose.model('Admin', adminSchema);

// Ruta de Inicio de Sesión (Login Seguro)
app.post('/api/login', async (req, res) => {
  const { password } = req.body;

  try {
    let admin = await Admin.findOne({ usuario: 'admin' });

    // Si es la primera vez, crea el admin automáticamente con la contraseña "Ariel1811" cifrada
    if (!admin) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash('Ariel1811', salt);
      admin = new Admin({ usuario: 'admin', passwordHash: hash });
      await admin.save();
    }

    // Compara la contraseña ingresada de forma segura con el hash de la base de datos
    const esValida = await bcrypt.compare(password, admin.passwordHash);

    if (esValida) {
      res.json({ exito: true, mensaje: 'Acceso autorizado' });
    } else {
      res.status(401).json({ exito: false, mensaje: 'Contraseña incorrecta' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// ==========================================
// ESQUEMA Y MODELO DE VIDEO (Actualizado con vistas y likes)
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

// 1. Guardar un nuevo video
app.post('/api/videos', async (req, res) => {
  try {
    const nuevoVideo = new Video(req.body);
    await nuevoVideo.save();
    res.status(201).json({ mensaje: '¡Video guardado exitosamente!', video: nuevoVideo });
  } catch (error) {
    console.error('Error al guardar el video:', error);
    res.status(500).json({ error: 'Error interno al guardar el video' });
  }
});

// 2. Obtener la lista de todos los videos
app.get('/api/videos', async (req, res) => {
  try {
    const videos = await Video.find().sort({ fechaCreacion: -1 });
    res.json(videos);
  } catch (error) {
    console.error('Error al obtener los videos:', error);
    res.status(500).json({ error: 'Error al obtener los videos' });
  }
});

// 3. Eliminar un video por su ID
app.delete('/api/videos/:id', async (req, res) => {
  try {
    await Video.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Video eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar el video:', error);
    res.status(500).json({ error: 'Error al eliminar el video' });
  }
});

// 4. Incrementar reproducciones (vistas)
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

// 5. Incrementar o decrementar likes
app.put('/api/videos/:id/like', async (req, res) => {
  const { accion } = req.body; // 'sumar' o 'restar'
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

// Puerto dinámico para Render (o 3000 si se ejecuta localmente)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});