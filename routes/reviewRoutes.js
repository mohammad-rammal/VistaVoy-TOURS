const reviewController = require('../controllers/reviewController.js');
const express = require('express');
const {protect, restrictTo} = require('../middlewares/protect.js');

const app = express();

const router = express.Router({mergeParams: true}); // mergeParams for mounting router to tourRoutes

router.use(protect);
router
    .route('/')
    .get(reviewController.getAllReviews)
    .post(restrictTo('user'), reviewController.setTourUserIds, reviewController.createReview);
router
    .route('/:id')
    .get(reviewController.getReviewById)
    .patch(restrictTo('user', 'admin'), reviewController.updateReview)
    .delete(restrictTo('user', 'admin'), reviewController.deleteReview);

module.exports = router;
