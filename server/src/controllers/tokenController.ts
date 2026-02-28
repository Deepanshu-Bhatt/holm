import { Response } from 'express';
const Razorpay=  require('razorpay');
import crypto from 'crypto';
import pool from '../models/db';
import { AuthRequest } from '../middleware/auth';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// GET ALL PACKAGES
export const getPackages = async (req: AuthRequest, res: Response) => {
  try {
    const [packages] = await pool.query(
      'SELECT * FROM token_packages WHERE is_active = TRUE'
    ) as any;
    res.json(packages);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// CREATE RAZORPAY ORDER
export const createOrder = async (req: AuthRequest, res: Response) => {
  const { packageId } = req.body;

  try {
    // Find the package
    const [pkgs] = await pool.query(
      'SELECT * FROM token_packages WHERE id = ?',
      [packageId]
    ) as any;

    if (!pkgs.length) {
      return res.status(404).json({ message: 'Package not found' });
    }

    const pkg = pkgs[0];

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: Math.round(pkg.price_inr * 100), // convert to paise
      currency: 'INR',
      receipt: `holm_${req.userId}_${Date.now()}`,
    });

    // Save pending transaction
    await pool.query(
      `INSERT INTO token_transactions 
       (user_id, type, tokens, description, razorpay_order_id, status) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.userId, 'purchase', pkg.tokens, `Purchased ${pkg.name} package`, order.id, 'pending']
    );

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
      packageName: pkg.name,
      tokens: pkg.tokens
    });

  } catch (err) {
    res.status(500).json({ message: 'Order creation failed' });
  }
};

// VERIFY PAYMENT & ADD TOKENS
export const verifyPayment = async (req: AuthRequest, res: Response) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  // Step 1 - Verify signature
  const sign = razorpay_order_id + '|' + razorpay_payment_id;
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(sign)
    .digest('hex');

  if (expected !== razorpay_signature) {
    return res.status(400).json({ message: 'Invalid signature' });
  }

  try {
    // Step 2 - Find the pending transaction
    const [txns] = await pool.query(
      'SELECT * FROM token_transactions WHERE razorpay_order_id = ? AND user_id = ?',
      [razorpay_order_id, req.userId]
    ) as any;

    if (!txns.length) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const txn = txns[0];

    // Step 3 - Mark transaction as success
    await pool.query(
      'UPDATE token_transactions SET status = ?, razorpay_payment_id = ? WHERE id = ?',
      ['success', razorpay_payment_id, txn.id]
    );

    // Step 4 - Add tokens to user
    await pool.query(
      'UPDATE users SET tokens = tokens + ? WHERE id = ?',
      [txn.tokens, req.userId]
    );

    // Step 5 - Return new balance
    const [user] = await pool.query(
      'SELECT tokens FROM users WHERE id = ?',
      [req.userId]
    ) as any;

    res.json({
      success: true,
      tokensAdded: txn.tokens,
      newTokenBalance: user[0].tokens
    });

  } catch (err) {
    res.status(500).json({ message: 'Payment verification failed' });
  }
};

// GET TOKEN HISTORY
export const getTokenHistory = async (req: AuthRequest, res: Response) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM token_transactions 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT 20`,
      [req.userId]
    ) as any;
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};