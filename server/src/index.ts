import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './models/db';
import authRoutes from './routes/auth';
import tokenRoutes from './routes/tokens';
import notesRoutes from './routes/notes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/api/notes', notesRoutes);

pool.getConnection()
  .then(() => console.log('✅ MySQL connected'))
  .catch((err) => console.error('❌ MySQL connection failed:', err.message));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tokens', tokenRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'HOLM API is running 🚀' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});