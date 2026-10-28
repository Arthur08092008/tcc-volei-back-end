// routes/checklistRoutes.js
const express = require('express');
const router = express.Router();
const checklistController = require('../controllers/checklistControllers');

router.get('/:partidaId', checklistController.listarPorPartida);
router.post('/:partidaId', checklistController.criar);
router.put('/item/:id', checklistController.atualizar);
router.delete('/item/:id', checklistController.excluir);

module.exports = router;