const express = require('express');
const app = express();
const viewController = require('../controllers/viewController.js');
const bookingController = require('../controllers/bookingController.js');
const {protect, isLoggedIn} = require('../middlewares/protect.js');

const router = express.Router();

router.use(isLoggedIn);

router.get('/', bookingController.createBookingCheckout, viewController.getOverView);

router.get('/login', viewController.getLoginForm);

router.get('/tour/:slug', viewController.getTour);

router.get('/me', protect, viewController.getAccount);
router.get('/my-tours', protect, viewController.getMyTours);

router.post('/submit-user-data', protect, viewController.updateUserData);

module.exports = router;
