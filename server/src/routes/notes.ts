import { Router } from 'express';
import { generateNotes, getAllNotes, getNoteById, deleteNote } from '../controllers/notesController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.post('/generate', authMiddleware, generateNotes);
router.get('/', authMiddleware, getAllNotes);
router.get('/:id', authMiddleware, getNoteById);
router.delete('/:id', authMiddleware, deleteNote);

export default router;