const fs = require('fs');
const https = require('https');
const path = require('path');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = Number(process.env.PORT || 2000);

function resolveFirstExistingPath(candidates) {
    for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
            return candidate;
        }
    }

    return null;
}

const certDirCandidates = [
    path.resolve(__dirname, 'certs'),
    path.resolve(__dirname, '../certs'),
];

const keyPath = resolveFirstExistingPath(
    certDirCandidates.map((dir) => path.join(dir, 'localhost.key')),
);

const certPath = resolveFirstExistingPath(
    certDirCandidates.flatMap((dir) => [
        path.join(dir, 'localhost.pem'),
        path.join(dir, 'localhost.crt'),
    ]),
);

if (!keyPath || !certPath) {
    throw new Error(
        'HTTPS certificate files not found. Expected certs/localhost.key and certs/localhost.crt (or localhost.pem).',
    );
}

const httpsOptions = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
};

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    https
        .createServer(httpsOptions, (req, res) => handle(req, res))
        .listen(port, hostname, () => {
            console.log(`> HTTPS server ready on https://${hostname}:${port}`);
        });
});
