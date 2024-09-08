const APIFeatures = require('../utils/APIFeatures');
// const catchAsync = require('../middlewares/catchAsync');
const AppError = require('../utils/appError');
const Review = require('../models/reviewModel');

const factory = require('./handlerFactory');

/*********************
 * @ Get All
 * GET
 **********************/
exports.getAllReviews = factory.getAll(Review);
// exports.getAllReviews = catchAsync(async (req, res, next) => {
//     let filter = {};
//     if (req.params.tourId) {
//         filter = {tour: req.params.tourId};
//     }

//     const reviews = await Review.find(filter);

//     res.status(200).json({
//         status: 'success',
//         results: reviews.length,
//         data: {
//             reviews,
//         },
//     });
// });

/*********************
 * @ Get By ID
 * GET
 **********************/
exports.getReviewById = factory.getOne(Review);
// exports.getReviewById = catchAsync(async (req, res, next) => {
//     const reviewID = await Review.findById(req.params.id);

//     if (!reviewID) {
//         return next(new AppError(`No review found with ID ${req.params.id}`, 404));
//     }
//     res.status(201).json({
//         status: 'success',
//         data: {
//             review: reviewID,
//         },
//     });
// });

/*********************
 * @ Create
 * POST
 **********************/
exports.setTourUserIds = (req, res, next) => {
    // Allow nested routes
    if (!req.body.tour) {
        req.body.tour = req.params.tourId;
    }

    if (!req.body.user) {
        req.body.user = req.user.id;
    }
    next();
};
exports.createReview = factory.createOne(Review);
// exports.createReview = catchAsync(async (req, res, next) => {
//     const newReview = await Review.create(req.body);

//     res.status(201).json({
//         status: 'success',
//         data: {
//             review: newReview,
//         },
//     });
// });

/*********************
 * @ Update Review
 * PATCH
 **********************/
exports.updateReview = factory.updateOne(Review);

/*********************
 * @ Delete Tour
 * DELETE
 **********************/
exports.deleteReview = factory.deleteOne(Review);
