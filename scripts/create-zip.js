const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const output = fs.createWriteStream('assistant-bridge-desktop.zip');
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', () => {
    console.log(`Zip file created: ${archive.pointer()} total bytes`);
});

archive.on('error', (err) => {
    throw err;
});

archive.pipe(output);

const filesToInclude = [
    'main.js',
    'preload.js',
    'package.json',
    'index.html',
    'styles.css',
    'app.js',
    'src/bridge-server.js'
];

filesToInclude.forEach(file => {
    if (fs.existsSync(file)) {
        archive.file(file, { name: path.basename(file) });
    }
});

archive.finalize();