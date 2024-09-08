const express = require('express');
const app = express();
const viewController = require('../controllers/viewController.js');
const {protect, isLoggedIn} = require('../middlewares/protect.js');

const router = express.Router();

router.use(isLoggedIn);

router.get('/', viewController.getOverView);
router.get('/login', viewController.getLoginForm);

router.get('/tour/:slug', protect, viewController.getTour);

router.get('/me', protect, viewController.getAccount);
router.post('/submit-user-data', protect, viewController.updateUserData);

module.exports = router;
