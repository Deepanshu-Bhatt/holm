export interface User {
  id: number;
  name: string;
  email: string;
  tokens: number;
}

export interface Note {
  id: number;
  title: string;
  notes: string;
  tokens_used: number;
  created_at: string;
}

export interface TokenPackage {
  id: number;
  name: string;
  tokens: number;
  price_inr: number;
}

export interface TokenTransaction {
  id: number;
  type: 'purchase' | 'deduct';
  tokens: number;
  description: string;
  status: string;
  created_at: string;
}