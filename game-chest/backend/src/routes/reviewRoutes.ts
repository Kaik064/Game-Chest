import { Router } from 'express';
import {
  createReview,
  listReviews,
  getReviewById,
  updateReview,
  deleteReview
} from '../controllers/reviewController';
import { autenticacaoOpcional, exigirLogin } from '../middlewares/auth';

const router = Router();

// Leitura é pública; `meus=1` usa a sessão quando existir.
router.get('/', autenticacaoOpcional, listReviews);
router.get('/:id', getReviewById);

// Escrita exige login; o controller confere a propriedade da review.
router.post('/', exigirLogin, createReview);
router.put('/:id', exigirLogin, updateReview);
router.delete('/:id', exigirLogin, deleteReview);

export default router;
