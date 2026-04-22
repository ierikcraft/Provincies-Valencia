const express = require('express');
const multer = require('multer');
const path = require('path');
const { put, list } = require('@vercel/blob'); // Importamos la API de Vercel Blob

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Usamos la memoria RAM solo un segundo para recibir el archivo antes de enviarlo a la nube de Vercel
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Servir la carpeta 'public' (donde están tus HTML)
app.use(express.static(path.join(__dirname, 'public')));

// 1. ENDPOINT PARA SUBIR EL PDF (Permanente)
app.post('/api/upload', upload.single('imagen'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No se subió ningún archivo.');
    }

    try {
        const numero = req.body.numero;
        const nombreArchivo = `pdf_${numero}.pdf`; // Se guardará como pdf_1.pdf, pdf_2.pdf, etc.

        // Subimos el archivo a la nube de Vercel Blob
        await put(nombreArchivo, req.file.buffer, {
            access: 'public',
            addRandomSuffix: false // Obligamos a que mantenga el nombre exacto
        });

        res.send(`
            <div style="font-family: sans-serif; text-align: center; margin-top: 50px;">
                <h2 style="color: green;">¡PDF subido a la nube con éxito!</h2>
                <p style="color: #374151; margin-top: 10px;">
                    Guardado permanentemente como <b>${numero}.pdf</b> en Vercel Blob.
                </p>
                <br>
                <a href="/admin.html" style="padding: 10px 20px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px;">Volver al Admin</a>
                <a href="/" style="padding: 10px 20px; background: #4b5563; color: white; text-decoration: none; border-radius: 5px; margin-left: 10px;">Ir al Inicio</a>
            </div>
        `);
    } catch (error) {
        console.error("Error subiendo a Vercel Blob:", error);
        res.status(500).send('<h2 style="text-align:center; margin-top:50px;">Error. ¿Activaste Vercel Blob en tu panel? (Lee las instrucciones)</h2>');
    }
});

// 2. ENDPOINT PARA LEER EL PDF
app.get('/image/:archivo', async (req, res) => {
    try {
        // Obtenemos el número del PDF que ha pedido el usuario
        const numero = req.params.archivo.replace('.pdf', '');
        const nombreBuscado = `pdf_${numero}.pdf`;

        // Buscamos el archivo en la nube
        const { blobs } = await list();
        const pdfEncontrado = blobs.find(b => b.pathname === nombreBuscado);

        if (pdfEncontrado) {
            // Si existe, redirigimos directamente al enlace permanente de la nube
            res.redirect(pdfEncontrado.url);
        } else {
            res.status(404).send('<h2 style="text-align:center; font-family:sans-serif; margin-top:50px;">PDF no encontrado. Súbelo primero en el panel Admin.</h2>');
        }
    } catch (error) {
        res.status(500).send('Error buscando el archivo en la nube.');
    }
});

// 3. ENDPOINTS PARA EL FONDO (También guardado en la nube permanente)
app.post('/api/background', async (req, res) => {
    try {
        const base64Data = req.body.background;
        const base64Image = base64Data.split(';base64,').pop();
        const buffer = Buffer.from(base64Image, 'base64');

        await put('fondo_personalizado.jpg', buffer, {
            access: 'public',
            addRandomSuffix: false
        });

        res.json({ success: true });
    } catch (error) {
        console.error("Error subiendo fondo:", error);
        res.status(500).json({ success: false });
    }
});

app.get('/api/background', async (req, res) => {
    try {
        const { blobs } = await list();
        const fondoEncontrado = blobs.find(b => b.pathname === 'fondo_personalizado.jpg');
        
        if (fondoEncontrado) {
            res.json({ background: fondoEncontrado.url });
        } else {
            res.json({ background: '' }); 
        }
    } catch (error) {
        res.json({ background: '' });
    }
});

// Exportar para Vercel
module.exports = app;

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
}
