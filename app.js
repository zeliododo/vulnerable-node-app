const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const os = require('os');
const app = express();
const port = 3000;

// Get host information
const hostname = os.hostname();
const networkInterfaces = os.networkInterfaces();
let ipAddress = 'Unknown';

// Try to find the IP address
Object.keys(networkInterfaces).forEach((interfaceName) => {
  const interfaces = networkInterfaces[interfaceName];
  for (let i = 0; i < interfaces.length; i++) {
    const iface = interfaces[i];
    if (iface.family === 'IPv4' && !iface.internal) {
      ipAddress = iface.address;
      break;
    }
  }
});

// Connect to SQLite database
const db = new sqlite3.Database('./mydb.sqlite', (err) => {
  if (err) {
    console.error('Error opening database', err);
  } else {
    console.log('Connected to the SQLite database.');
    initDb();
  }
});

// Initialize database with sample data
function initDb() {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    password TEXT
  )`, (err) => {
    if (err) {
      console.error('Error creating table', err);
    } else {
      // Insert sample data
      db.run(`INSERT OR IGNORE INTO users (id, username, password) VALUES 
        (1, 'admin', 'admin123'),
        (2, 'user', 'password123')`);
    }
  });
}

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

// Host info route
app.get('/api/hostinfo', (req, res) => {
  res.json({ hostname, ipAddress });
});

// Vulnerable login route (SQL Injection)
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  // Vulnerable query
  const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
  
  db.get(query, (err, row) => {
    if (err) {
      res.status(500).json({ success: false, message: 'Database error' });
    } else if (row) {
      res.json({ success: true, message: 'Login successful' });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  });
});

// Vulnerable data retrieval route (Insecure Direct Object Reference)
app.get('/api/user/:id', (req, res) => {
  const userId = req.params.id;
  // Vulnerable query
  const query = `SELECT * FROM users WHERE id = ${userId}`;
  
  db.get(query, (err, row) => {
    if (err) {
      res.status(500).json({ message: 'Database error' });
    } else if (row) {
      res.json(row);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  });
});

// XSS vulnerable route
app.get('/api/echo', (req, res) => {
  const message = req.query.message;
  res.send(`<h1>Echo: ${message}</h1>`);
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Vulnerable app listening at http://${ipAddress}:${port}`);
  console.log(`Hostname: ${hostname}`);
});

// Close the database connection when the app is terminated
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Closed the database connection.');
    process.exit(0);
  });
});