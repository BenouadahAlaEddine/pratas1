require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const { initDB } = require('./db');
const notifRoutes = require('./routes/notifications');

const app = express();
const PORT = process.env.PORT || 3005;

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'notifications', port: PORT }));

app.use('/', notifRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

initDB();
app.listen(PORT, () => console.log(`🔔 [Notifications Service] Running on port ${PORT}`));
