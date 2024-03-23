require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('./database');

const { body, validationResult } = require('express-validator');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

// Middleware to check access token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Middleware to check for superuser status
const requireSuperuser = (req, res, next) => {
  if (!req.user.is_superuser) {
    return res.status(403).json({ message: "This action requires superuser privileges." });
  }
  next();
};

// User login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  pool.query('SELECT * FROM users WHERE email = ?', [email], async (error, results) => {
      if (error) {
          return res.status(500).json({ message: 'Error logging in', error: error });
      }
      if (results.length === 0) {
          return res.status(401).json({ message: 'Incorrect email or password' });
      }

      const user = results[0];

      try {
          if (await bcrypt.compare(password, user.password)) {
              
              const accessToken = jwt.sign({ userId: user.id, is_superuser: user.is_superuser }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
              const refreshToken = jwt.sign({ userId: user.id, is_superuser: user.is_superuser }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '1h' });

              
              const expiresAt = new Date();
              expiresAt.setHours(expiresAt.getHours() + 1);
              pool.query('INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)', 
              [user.id, refreshToken, expiresAt], (error, results) => {
                  if (error) {
                      return res.status(500).json({ message: 'Error saving refresh token', error: error });
                  }

                  res.json({ accessToken, refreshToken });
              });
          } else {
              res.status(401).json({ message: 'Incorrect email or password' });
          }
      } catch {
          res.status(500).json({ message: 'Error logging in' });
      }
  });
});

// User logout
app.post('/logout', (req, res) => {
  const { refreshToken } = req.body; 

  // Delete the refresh token from the database
  pool.query('DELETE FROM refresh_tokens WHERE token = ?', [refreshToken], (error, results) => {
      if (error) {
          return res.status(500).json({ message: 'Error logging out', error: error });
      }

      res.status(200).json({ message: 'The user has been logged out successfully.' });
  });
});

// Endpoint to refresh the access token
app.post('/token', (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken == null) return res.sendStatus(401);

  
  pool.query('SELECT * FROM refresh_tokens WHERE token = ?', [refreshToken], (error, results) => {
      if (error) {
          return res.status(500).json({ message: 'Error validating refresh token', error });
      }
      if (results.length === 0) {
          return res.status(403).json({ message: 'Refresh token not found' });
      }

      
      const tokenRecord = results[0];
      if (new Date() > new Date(tokenRecord.expires_at)) {
          return res.status(403).json({ message: 'Refresh token expired' });
      }

      
      jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
          if (err) return res.sendStatus(403);

          
          pool.query('SELECT is_superuser FROM users WHERE id = ?', [decoded.userId], (error, userResults) => {
              if (error) {
                  return res.status(500).json({ message: 'Error fetching user details', error });
              }
              if (userResults.length === 0) {
                  return res.status(404).json({ message: 'User not found' });
              }

              
              const user = userResults[0];
              const accessToken = jwt.sign(
                { userId: decoded.userId, is_superuser: user.is_superuser }, 
                process.env.ACCESS_TOKEN_SECRET, 
                { expiresIn: '10m' }
              );
              res.json({ accessToken });
          });
      });
  });
});
 
// Create a new user 
app.post('/users',
  [
    body('email').isEmail().normalizeEmail(),
    body('name').trim().escape(),
    body('password').trim(),
    body('is_superuser').isBoolean().optional(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, is_superuser = false } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    pool.query('INSERT INTO users (name, email, password, is_superuser) VALUES (?, ?, ?, ?)', [name, email, hashedPassword, is_superuser], (error, results) => {
      if (error) {
        return res.status(500).json({ message: 'Error adding user', error: error });
      }
      res.status(201).json({ id: results.insertId, name, email, is_superuser });
    });
  }
);

// Get a list of users with pagination
app.get('/users', authenticateToken, (req, res) => {
  let { page, limit } = req.query;
  page = parseInt(page, 10) || 1;
  limit = parseInt(limit, 10) || 10;
  const start = (page - 1) * limit;

  const usersQuery = 'SELECT id, name, email, is_superuser FROM users LIMIT ?, ?';
  pool.query(usersQuery, [start, limit], (usersError, usersResults) => {
    if (usersError) {
      return res.status(500).json({ message: 'Error retrieving users', error: usersError.toString() });
    }

    const countQuery = 'SELECT COUNT(*) AS total FROM users';
    pool.query(countQuery, (countError, countResults) => {
      if (countError) {
        return res.status(500).json({ message: 'Error counting users', error: countError.toString() });
      }

      const total = countResults[0].total;
      const totalPages = Math.ceil(total / limit);

      res.json({
        data: usersResults,
        total,
        totalPages,
        currentPage: page,
        limit
      });
    });
  });
});

// Update user details
app.put('/users/:id', authenticateToken, requireSuperuser, 
  body('name').optional().trim().escape(),
  body('email').optional().isEmail().normalizeEmail(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email } = req.body;
    const { id } = req.params;

  pool.query('UPDATE users SET name = ?, email = ? WHERE id = ?', [name, email, id], (error, results) => {
    if (error) {
      return res.status(500).json({ message: 'Error updating user', error });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User updated successfully' });
  });
});

// Delete a user
app.delete('/users/:id', authenticateToken, requireSuperuser, (req, res) => {
  const { id } = req.params;

  pool.query('DELETE FROM users WHERE id = ?', [id], (error, results) => {
      if (error) {
          return res.status(500).json({ message: 'Error deleting user', error: error });
      }
      if (results.affectedRows === 0) {
          return res.status(404).json({ message: 'User not found' });
      }
      res.json({ message: 'User deleted successfully' });
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

module.exports = app; 