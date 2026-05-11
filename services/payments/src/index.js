require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const { initDB } = require('./db');
const paymentRoutes = require('./routes/payments');

const app = express();
const PORT = process.env.PORT || 3004;

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'payments', port: PORT }));

app.use('/', paymentRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

initDB();
app.listen(PORT, () => console.log(`💳 [Payments Service] Running on port ${PORT}`));
