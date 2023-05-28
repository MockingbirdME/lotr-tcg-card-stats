import 'dotenv/config.js';

import bodyParser from 'body-parser';
import express  from "express";

import { apiRouter } from './api/v1/index.js';

const PORT = process.env.PORT || 3001;

const app = express();


// 1. Install bodyParsers for the request types your API will support
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.text());
app.use(bodyParser.json());

app.use("/api", apiRouter);

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});

// For any other request, let React handle it.
// export const reactPath = new URL('../client/build', import.meta.url);

// app.use(express.static(reactPath.pathname))

app.use((req, res) => {
  res.send('hi hi')
  // res.sendFile(`${reactPath.pathname}/index.html`);
});