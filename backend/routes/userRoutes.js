import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// Example route (you can add more later)
router.get('/', (req, res) => {
  res.send('User routes working!');
});

export default router;
