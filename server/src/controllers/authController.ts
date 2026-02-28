import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../models/db';
import { AuthRequest } from '../middleware/auth';

// REGISTER
export const register = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  try {
    // Check if email already exists
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE email = ?', 
      [email]
    ) as any;

    if (existing.length > 0) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    // Hash the password
    const hash = await bcrypt.hash(password, 10);

    // Save user to DB
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password_hash, tokens) VALUES (?, ?, ?, 50)',
      [name, email, hash]
    ) as any;

    // Create JWT token
    const token = jwt.sign(
      { userId: result.insertId },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: result.insertId,
        name,
        email,
        tokens: 50
      }
    });

  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// LOGIN
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE email = ?', 
      [email]
    ) as any;

    if (rows.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = rows[0];

    // Compare password
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create JWT token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        tokens: user.tokens
      }
    });

  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// GET LOGGED IN USER
export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, tokens, created_at FROM users WHERE id = ?',
      [req.userId]
    ) as any;

    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};