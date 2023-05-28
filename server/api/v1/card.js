import createError from 'http-errors';
import { Router } from 'express';

import Card from '../../classes/Card.js';

export const cardRouter = new Router();