import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import api from './routes/index.js';
import { config } from './config.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(
  cors({
    origin: config.corsOrigin,
    credentials: false,
  })
);
app.use(helmet());
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

app.use('/api', api);
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`PGAS backend listening on http://localhost:${config.port}`);
});
