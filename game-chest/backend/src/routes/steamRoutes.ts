import { Router } from 'express';
import {
  getMinhaBiblioteca,
  getSteamAppDetails,
  getUserGames,
  searchSteamGames
} from '../controllers/steamController';
import { exigirLogin } from '../middlewares/auth';

const router = Router();

// Catálogo (público): busca e metadados não dependem de conta Steam.
router.get('/search', searchSteamGames);
router.get('/app/:appid', getSteamAppDetails);

// Biblioteca (privada): usa o SteamID vinculado à conta logada.
router.get('/biblioteca', exigirLogin, getMinhaBiblioteca);

// Compatibilidade: consulta por SteamID64 informado na URL.
router.get('/user-games/:steamId', getUserGames);

export default router;
