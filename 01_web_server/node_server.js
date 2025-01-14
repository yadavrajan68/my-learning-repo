const http = require('http');
const hostname = '127.0.0.1';
const port = 3001;

const server = http.createServer((req, res) => {
   if (req.url === '/') {
     res.statusCode = 200;
     res.setHeader('Content-Type', 'text/plain');
     res.end("Hello World! I am Learning Node.js");
   } else if (req.url === '/m') {
     res.statusCode = 200;
     res.setHeader("Content-Type", "text/plain");
     res.end("thanks for Learning Node.js");
    
   } else{
    res.statusCode = 404;
    res.setHeader("Content-Type", "text/plain");
    res.end("404, Not Found");
   }
})

server.listen(port,hostname, () => {
    console.log(`Server is listening on http://${hostname}:${port}`);
})