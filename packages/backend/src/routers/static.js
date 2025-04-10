import express from 'express';
import path from 'path';

const app = express.Router();
const staticPath = express.static(path.join(__dirname, '../www'));

app.use('/', staticPath);

app.use('/management', staticPath);
app.use('/management/*', staticPath);

export default app;
