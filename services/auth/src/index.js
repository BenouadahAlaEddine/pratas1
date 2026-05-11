require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const { initDB } = require('./db');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Health check
app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'auth', port: PORT }));

// Routes
app.use('/', authRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

// Init DB then start
initDB();
app.listen(PORT, () => console.log(`🔐 [Auth Service] Running on port ${PORT}`));
