const express = require('express');
const {
  getOrganisations,
  getOrganisation,
  createOrganisation,
  addUserToOrganisation,
} = require('../controllers/organisationController');
const authenticate = require('../middlewares/authenticate');
const router = express.Router();

router.use(authenticate);

router.get('/', getOrganisations);
router.get('/:orgId', getOrganisation);
router.post('/', createOrganisation);
router.post('/:orgId/users', addUserToOrganisation);

module.exports = router;
