require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const { initDB } = require('./db');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'products', port: PORT }));

app.use('/', productRoutes);
app.use('/categories', categoryRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

initDB();
app.listen(PORT, () => console.log(`📦 [Products Service] Running on port ${PORT}`));
