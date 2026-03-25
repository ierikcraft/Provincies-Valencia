const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Asegurar que el directorio /image/ existe
const imageDir = path.join(__dirname, 'image');
if (!fs.existsSync(imageDir)){
    fs.mkdirSync(imageDir);
}

// Configuración de Multer para recibir la imagen
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // En local guarda en la carpeta /image/
        // NOTA: En Vercel, este directorio es temporal (ver explicación abajo)
        cb(null, imageDir);
    },
    filename: function (req, file, cb) {
        // Usamos el número que viene del formulario de admin + .png
        const numero = req.body.numero;
        cb(null, numero + '.png');
    }
});

const upload = multer({ storage: storage });

// Servir la carpeta 'public' estáticamente (donde están los HTML)
app.use(express.static(path.join(__dirname, 'public')));

// Servir la carpeta 'image' para que /image/numero.png funcione
app.use('/image', express.static(imageDir));

// Ruta POST para procesar la subida de imágenes desde admin.html
app.post('/api/upload', upload.single('imagen'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No se subió ninguna imagen.');
    }
    // Redirige de vuelta al admin o muestra un mensaje de éxito
    res.send(`
        <div style="font-family: sans-serif; text-align: center; margin-top: 50px;">
            <h2 style="color: green;">¡Imagen subida con éxito como ${req.body.numero}.png!</h2>
            <br>
            <a href="/admin.html" style="padding: 10px 20px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px;">Volver al Admin</a>
            <a href="/" style="padding: 10px 20px; background: #4b5563; color: white; text-decoration: none; border-radius: 5px; margin-left: 10px;">Ir al Inicio</a>
        </div>
    `);
});

// Exportar para Vercel Serverless, y escuchar puerto para pruebas locales
module.exports = app;

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
}
