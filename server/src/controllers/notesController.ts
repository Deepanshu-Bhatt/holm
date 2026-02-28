import { Response } from 'express';
import Groq from 'groq-sdk';
import pool from '../models/db';
import { AuthRequest } from '../middleware/auth';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!
});

const NOTES_COST = 10;

async function deductTokens(userId: number, amount: number, description: string) {
  const [rows] = await pool.query(
    'SELECT tokens FROM users WHERE id = ?',
    [userId]
  ) as any;

  if (rows[0].tokens < amount) {
    throw new Error('Insufficient tokens');
  }

  await pool.query(
    'UPDATE users SET tokens = tokens - ? WHERE id = ?',
    [amount, userId]
  );

  await pool.query(
    `INSERT INTO token_transactions 
     (user_id, type, tokens, description, status) 
     VALUES (?, ?, ?, ?, ?)`,
    [userId, 'deduct', amount, description, 'success']
  );
}

// GENERATE NOTES FROM TEXT
export const generateNotes = async (req: AuthRequest, res: Response) => {
  const { title, text } = req.body;

  if (!text) {
    return res.status(400).json({ message: 'Text is required' });
  }

  try {
    await deductTokens(req.userId!, NOTES_COST, `AI Notes: ${title}`);

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are an expert academic note-taker. Generate comprehensive, well-structured notes from the text the user provides.'
        },
        {
          role: 'user',
          content: `Generate structured notes from the following text. Include:

📌 Key Concepts
📚 Main Topics with bullet summaries
💡 Important Insights
🔑 Key Takeaways
❓ Possible Exam Questions

Text:
${text}

Format with clear headings and bullet points. Be concise but thorough.`
        }
      ],
      max_tokens: 2048,
    });

    const notes = completion.choices[0].message.content || ''

    const [result] = await pool.query(
      `INSERT INTO ai_notes 
       (user_id, title, notes, tokens_used) 
       VALUES (?, ?, ?, ?)`,
      [req.userId, title || 'Untitled Notes', notes, NOTES_COST]
    ) as any;

    const [user] = await pool.query(
      'SELECT tokens FROM users WHERE id = ?',
      [req.userId]
    ) as any;

    res.json({
      noteId: result.insertId,
      title: title || 'Untitled Notes',
      notes,
      tokensRemaining: user[0].tokens
    });

  } catch (err: any) {
    if (err.message === 'Insufficient tokens') {
      return res.status(402).json({ message: 'Insufficient tokens' });
    }
    res.status(500).json({ message: 'Notes generation failed', error: err.message });
  }
};

// GET ALL NOTES
export const getAllNotes = async (req: AuthRequest, res: Response) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, title, tokens_used, created_at 
       FROM ai_notes 
       WHERE user_id = ? 
       ORDER BY created_at DESC`,
      [req.userId]
    ) as any;
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// GET SINGLE NOTE
export const getNoteById = async (req: AuthRequest, res: Response) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM ai_notes WHERE id = ? AND user_id = ?',
      [req.params.id, req.userId]
    ) as any;

    if (!rows.length) {
      return res.status(404).json({ message: 'Note not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE NOTE
export const deleteNote = async (req: AuthRequest, res: Response) => {
  try {
    await pool.query(
      'DELETE FROM ai_notes WHERE id = ? AND user_id = ?',
      [req.params.id, req.userId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};