const bookingController = require('../controllers/bookingController.js');
const express = require('express');
const {protect, restrictTo} = require('../middlewares/protect.js');

const app = express();

const router = express.Router();

router.use(protect);

router.get('/checkout-session/:tourId', bookingController.getCheckoutSession);

router.use(restrictTo('lead-guide', 'admin'));

router.route('/').get(bookingController.getAllBooking).post(bookingController.createBooking);
router
    .route('/id')
    .get(bookingController.getBooking)
    .patch(bookingController.updateBooking)
    .delete(bookingController.deleteBooking);

module.exports = router;
