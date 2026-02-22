import http from 'http';
import fs from 'fs';
import path from 'path';

const port = process.env.PORT || 3000;
const filePath = path.resolve('index.html');

const server = http.createServer((req, res) => {
  if (req.url === '/' && fs.existsSync(filePath)) {
    const html = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': 'text/html' });
    return res.end(html);
  }
  res.writeHead(404);
  res.end('Not Found');
});

server.listen(port, () => console.log(`web on ${port}`));
