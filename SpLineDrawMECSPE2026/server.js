/**
 * SpLine Draw MECSPE 2026 - Server
 * 
 * Serve l'app web e gestisce l'upload FTP verso il controller FANUC.
 * 
 * Uso:
 *   npm install
 *   node server.js
 * 
 * Su Android (Termux):
 *   pkg install nodejs
 *   cd SpLineDrawMECSPE2026
 *   npm install
 *   node server.js
 * 
 * Poi aprire http://localhost:3000 nel browser.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { Client } = require('basic-ftp');
const { Readable } = require('stream');

const PORT = 3000;

// MIME types for static files
const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.ico': 'image/x-icon',
    '.svg': 'image/svg+xml',
    '.woff2': 'font/woff2',
    '.woff': 'font/woff',
    '.ttf': 'font/ttf'
};

/**
 * Upload a file to FTP server
 */
async function uploadToFtp(ftpConfig, fileName, fileContent) {
    const client = new Client(60000);
    client.ftp.verbose = false;
    client.ftp.ipFamily = 4; // Force IPv4 (PASV instead of EPSV) - Fanuc compatibility

    try {
        await client.access({
            host: ftpConfig.host,
            port: ftpConfig.port || 21,
            user: ftpConfig.user || 'anonymous',
            password: ftpConfig.password || '',
            secure: false
        });

        // Use binary transfer mode
        await client.send('TYPE I');

        // Navigate to remote directory if specified
        if (ftpConfig.remotePath && ftpConfig.remotePath !== '/' && ftpConfig.remotePath !== '') {
            await client.cd(ftpConfig.remotePath);
        }

        // Upload from buffer via readable stream
        const stream = Readable.from([fileContent]);
        await client.uploadFrom(stream, fileName);

        return { success: true, message: `File ${fileName} caricato con successo` };
    } catch (err) {
        throw err;
    } finally {
        client.close();
    }
}

/**
 * Handle API requests
 */
async function handleApi(req, res) {
    if (req.method === 'POST' && req.url === '/api/ftp-upload') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
            try {
                const data = JSON.parse(body);
                const { ftpHost, ftpPort, ftpUser, ftpPassword, ftpRemotePath, fileName, fileContent } = data;

                if (!ftpHost || !fileName || !fileContent) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: 'Parametri mancanti (host, fileName, fileContent)' }));
                    return;
                }

                const ftpConfig = {
                    host: ftpHost,
                    port: parseInt(ftpPort) || 21,
                    user: ftpUser || 'anonymous',
                    password: ftpPassword || '',
                    remotePath: ftpRemotePath || '/'\n                };\n\n                const result = await uploadToFtp(ftpConfig, fileName, fileContent);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(result));

            } catch (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: err.message }));
            }
        });
        return;
    }

    // Test FTP connection
    if (req.method === 'POST' && req.url === '/api/ftp-test') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
            try {
                const data = JSON.parse(body);
                const client = new Client(60000);
                client.ftp.verbose = false;
                client.ftp.ipFamily = 4; // Force IPv4 (PASV instead of EPSV) - Fanuc compatibility

                await client.access({
                    host: data.ftpHost,
                    port: parseInt(data.ftpPort) || 21,
                    user: data.ftpUser || 'anonymous',
                    password: data.ftpPassword || '',
                    secure: false
                });

                // Use binary transfer mode
                await client.send('TYPE I');

                // Try to list files to confirm connection
                if (data.ftpRemotePath && data.ftpRemotePath !== '/') {
                    await client.cd(data.ftpRemotePath);
                }
                const list = await client.list();
                client.close();

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, message: `Connessione riuscita. ${list.length} file trovati.` }));

            } catch (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: err.message }));
            }
        });
        return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Endpoint non trovato' }));
}

/**
 * Serve static files
 */
function serveStatic(req, res) {
    let filePath = req.url === '/' ? '/index.html' : req.url;
    
    // Remove query string
    filePath = filePath.split('?')[0];
    
    // Security: prevent directory traversal
    filePath = path.normalize(filePath).replace(/^(\.\.[\/\\])+/, '');
    
    // Resolve to file system path - serve from same directory as server.js
    const fullPath = path.join(__dirname, filePath);
    
    // Also try parent directory for shared resources (fonts)
    const parentPath = path.join(__dirname, '..', filePath);
    
    // Check if file exists
    const tryPath = fs.existsSync(fullPath) ? fullPath : 
                    fs.existsSync(parentPath) ? parentPath : null;
    
    if (!tryPath) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
        return;
    }

    const ext = path.extname(tryPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(tryPath, (err, data) => {
        if (err) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('500 Internal Server Error');
            return;
        }
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
}

// Create HTTP server
const server = http.createServer((req, res) => {
    // CORS headers (for development)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // Route API vs static
    if (req.url.startsWith('/api/')) {
        handleApi(req, res);
    } else {
        serveStatic(req, res);
    }
});

server.listen(PORT, '0.0.0.0', () => {
    // Get local IP addresses
    const os = require('os');
    const interfaces = os.networkInterfaces();
    const addresses = [];
    for (const iface of Object.values(interfaces)) {
        for (const addr of iface) {
            if (addr.family === 'IPv4' && !addr.internal) {
                addresses.push(addr.address);
            }
        }
    }

    console.log('');
    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║     SpLine Draw MECSPE 2026 - Server Avviato    ║');
    console.log('╠══════════════════════════════════════════════════╣');
    console.log(`║  Locale:  http://localhost:${PORT}                 ║`);
    addresses.forEach(addr => {
        const url = `http://${addr}:${PORT}`;
        const padding = ' '.repeat(Math.max(0, 40 - url.length));
        console.log(`║  Rete:    ${url}${padding}║`);
    });
    console.log('╠══════════════════════════════════════════════════╣');
    console.log('║  Apri questo indirizzo nel browser del tablet   ║');
    console.log('║  Premi Ctrl+C per fermare il server             ║');
    console.log('╚══════════════════════════════════════════════════╝');
    console.log('');
});
