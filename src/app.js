const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const routes = require('./routes');
const camelCaseResponse = require('./middleware/caseTransform');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:4200' }));
app.use(express.json());
app.use(camelCaseResponse);

app.use('/api/v1', routes);

app.use((req, res) => {
  res.status(404).json({ message: 'Not found' });
});

app.use(errorHandler);

module.exports = app;
