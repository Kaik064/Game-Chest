import { Router } from 'express';
import {
  atualizarPerfil,
  buscarUsuarios,
  desvincularSteam,
  entrar,
  eu,
  iniciarVinculoSteam,
  registrar,
  retornoVinculoSteam,
  perfilPublico,
  sair
} from '../controllers/authController';
import { autenticacaoOpcional, exigirLogin } from '../middlewares/auth';

const router = Router();

router.post('/registrar', registrar);
router.post('/entrar', entrar);
router.post('/sair', sair);
router.get('/eu', autenticacaoOpcional, eu);
router.put('/perfil', exigirLogin, atualizarPerfil);

// Vínculo com a Steam via OpenID 2.0.
router.get('/steam/vincular', exigirLogin, iniciarVinculoSteam);
// O retorno é uma navegação de página inteira: a sessão é lida do cookie.
router.get('/steam/retorno', autenticacaoOpcional, retornoVinculoSteam);
router.post('/steam/desvincular', exigirLogin, desvincularSteam);

// Descoberta pública de outros perfis e suas reviews.
router.get('/usuarios', buscarUsuarios);
router.get('/usuarios/:id', perfilPublico);

export default router;
