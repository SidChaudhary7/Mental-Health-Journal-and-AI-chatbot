const express = require('express');
const cors = require('cors');

const app = express();

// Completely permissive CORS
app.use(cors({
  origin: true,
  credentials: true,
  optionsSuccessStatus: 200
}));

app.use(express.json());

// Simple health endpoint
app.get('/api/health', (req, res) => {
  console.log('Health check from:', req.headers.origin || 'no origin');
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Simple registration endpoint  
app.post('/api/auth/register', (req, res) => {
  console.log('Registration from:', req.headers.origin || 'no origin');
  console.log('Body:', req.body);
  res.json({ 
    success: true, 
    message: 'Registration successful',
    token: 'test-token',
    user: { id: 1, name: 'Test User', email: 'test@example.com' }
  });
});

const PORT = 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Minimal server running on port ${PORT}`);
  console.log(`Test with: curl http://localhost:${PORT}/api/health`);
});