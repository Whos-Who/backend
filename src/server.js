import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import handleError from './errors/handleError';

dotenv.config();

const PORT = process.env.PORT || 5000;

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello World!!');
});

// Handle resource not found
app.all('*', (req, res) => {
  return res
    .status(404)
    .json('The resource you are looking for does not exist!');
});

app.listen(PORT, () => {
  console.log(`Application running at ${PORT}`);
});

// General catch for other erros
app.use((err, req, res, next) => {
  return res.json(handleError(err));
});
