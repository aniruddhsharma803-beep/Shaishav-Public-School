const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Ensure upload directory exists
const uploadDir = path.join(__dirname, 'images');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage config
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Create unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'upload-' + uniqueSuffix + ext);
    }
});

const upload = multer({ storage: storage });

app.post('/upload', upload.single('mediaFile'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { section, title, description } = req.body;
        const filePath = 'images/' + req.file.filename; // Relative path for HTML

        let targetHtmlFile = '';
        let insertionMarker = '';
        let newHtmlBlock = '';

        if (section === 'gallery') {
            targetHtmlFile = path.join(__dirname, 'gallery.html');
            insertionMarker = '<!-- DYNAMIC_GALLERY_INSERTION -->';
            
            // Build the HTML snippet for a new gallery item
            newHtmlBlock = `        <div class="gallery-full-item animate-on-scroll" data-lightbox>
          <img src="${filePath}" alt="${title}">
          <div class="g-overlay">
            <h4>${title || 'Gallery Image'}</h4>
            <p>${description || ''}</p>
          </div>
        </div>\n`;
        } else {
            return res.status(400).json({ error: 'Unsupported section for dynamic injection' });
        }

        // Read and modify the HTML file
        if (fs.existsSync(targetHtmlFile)) {
            let htmlContent = fs.readFileSync(targetHtmlFile, 'utf8');
            if (htmlContent.includes(insertionMarker)) {
                // Insert the new block right before the marker
                htmlContent = htmlContent.replace(insertionMarker, newHtmlBlock + '        ' + insertionMarker);
                fs.writeFileSync(targetHtmlFile, htmlContent);
                console.log(`Successfully injected new item into ${section}.html`);
            } else {
                console.warn(`Warning: Insertion marker ${insertionMarker} not found in ${path.basename(targetHtmlFile)}`);
            }
        } else {
             console.warn(`Warning: Target file ${path.basename(targetHtmlFile)} not found.`);
        }

        res.json({ success: true, file: filePath, message: 'Upload successful & website updated!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error during upload processing' });
    }
});

app.listen(PORT, () => {
    console.log(`Admin Server running at http://localhost:${PORT}`);
    console.log(`Access the admin panel at http://localhost:${PORT}/admin.html`);
});
