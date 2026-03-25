const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Aumentar el límite para poder recibir imágenes grandes en Base64
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Variable en memoria para guardar el fondo temporalmente
let currentBackgroundBase64 = '';

// Endpoint para obtener el fondo actual
app.get('/api/background', (req, res) => {
    res.json({ background: currentBackgroundBase64 });
});

// Endpoint para guardar el nuevo fondo
app.post('/api/background', (req, res) => {
    currentBackgroundBase64 = req.body.background;
    res.json({ success: true });
});

// Vercel es de solo lectura. Solo permite escribir en la carpeta temporal /tmp
// Comprobamos si estamos en Vercel
const isVercel = process.env.VERCEL || process.env.NOW_REGION;

// Si estamos en Vercel usamos /tmp/image, si estamos en local usamos la carpeta normal
const imageDir = isVercel ? '/tmp/image' : path.join(__dirname, 'image');

// Intentamos crear el directorio
try {
    if (!fs.existsSync(imageDir)){
        fs.mkdirSync(imageDir, { recursive: true });
    }
} catch (error) {
    console.error("Error al crear el directorio:", error);
}

// Configuración de Multer para recibir la imagen
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, imageDir);
    },
    filename: function (req, file, cb) {
        const numero = req.body.numero;
        cb(null, numero + '.png');
    }
});

const upload = multer({ storage: storage });

// Servir la carpeta 'public' (donde están tus HTML)
app.use(express.static(path.join(__dirname, 'public')));

// Servir la carpeta donde se guardan las imágenes
app.use('/image', express.static(imageDir));

// Ruta POST para procesar la subida de imágenes
app.post('/api/upload', upload.single('imagen'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No se subió ninguna imagen.');
    }
    res.send(`
        <div style="font-family: sans-serif; text-align: center; margin-top: 50px;">
            <h2 style="color: green;">¡Imagen subida con éxito como ${req.body.numero}.png!</h2>
            <p style="color: #d97706; margin-top: 10px;">
                <strong>⚠️ Aviso de Vercel:</strong> Como estás en Vercel, esta imagen se ha guardado en la memoria temporal (/tmp). Desaparecerá al rato.
            </p>
            <br>
            <a href="/admin.html" style="padding: 10px 20px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px;">Volver al Admin</a>
            <a href="/" style="padding: 10px 20px; background: #4b5563; color: white; text-decoration: none; border-radius: 5px; margin-left: 10px;">Ir al Inicio</a>
        </div>
    `);
});

module.exports = app;

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
}
