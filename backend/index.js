export default function handler(req, res) {
  if (req.method === 'GET' && req.url === '/') {
    res.status(200).send('Hello from Vercel Node!');
  } else {
    res.status(404).send('Not Found');
  }
}