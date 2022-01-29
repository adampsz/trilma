import 'dotenv/config';

import app from './express';
import io from './socket';

import { createServer } from 'http';

const http = createServer();

http.on('request', app);
io.attach(http);

http.listen(process.env.PORT ?? 3000);
