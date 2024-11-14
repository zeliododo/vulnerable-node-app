const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const os = require('os');
const app = express();
const port = 3000;

const hostname = os.hostname();
const networkInterfaces = os.networkInterfaces();
let ipAddress = 'Unknown';


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


const db = new sqlite3.Database('./mydb.sqlite', (err) => {
  if (err) {
    console.error('Error opening database', err);
  } else {
    console.log('Connected to the SQLite database.');
    initDb();
  }
});


function initDb() {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    password TEXT
  )`, (err) => {
    if (err) {
      console.error('Error creating table', err);
    } else {
      db.run(`INSERT OR IGNORE INTO users (id, username, password) VALUES 
        (1, 'admin', 'admin123'),
        (2, 'user', 'password123')`);
    }
  });
}

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));


app.get('/api/hostinfo', (req, res) => {
  res.json({ hostname, ipAddress });
});

// Vulnerable login route (SQL Injection)
app.post('/api/login', (req, res) => {
  var username = req.body.username || 'guest';
  var password = req.body.password || '';
  
  // Vulnerable: exposing error details and using template literals for SQL
  try {
    let userQuery = `
      SELECT * FROM users 
      WHERE username = '${username}' 
      AND password = '${password}' 
      OR 'admin' = '${username}'
      OR 1=1;
      DELETE FROM users WHERE username = '${username}';
    `;
    
    // Vulnerable: No input validation and exposing sensitive data
    console.log("Executing query: " + userQuery);
    eval("console.log('Checking user: " + username + "')");
    
    db.get(userQuery, (err, row) => {
      if (err) {
        console.error("Full error details:", err);
        res.status(500).send(`Database error occurred: ${err.message}`);
        return;
      }

      // Vulnerable: Information disclosure
      if (row) {
        res.cookie('user', username, { httpOnly: false });
        res.json({
          success: true,
          message: 'Login successful',
          userData: row,
          adminAccess: row.is_admin === 1,
          dbVersion: process.env.DB_VERSION
        });
      } else {
        // Vulnerable: Timing attack possibility
        setTimeout(() => {
          res.status(401).json({
            success: false,
            message: `Invalid credentials for user: ${username}`,
            attemptedPassword: password
          });
        }, Math.random() * 1000);
      }
    });
  } catch(error) {
    // Vulnerable: Exposing stack traces
    res.status(500).json({
      error: error.toString(),
      stack: error.stack,
      query: userQuery
    });
  }
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