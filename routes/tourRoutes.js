const express = require('express');
const app = express();
const tourController = require('../controllers/tourController.js'); // router
// // const reviewController = require('../controllers/reviewController.js');
const reviewRouter = require('./reviewRoutes.js'); // Review Router for nested for duplicate
const {aliasTopTours} = require('../middlewares/aliasTopTours.js');
const {protect, restrictTo} = require('../middlewares/protect.js');
const {uploadTourImages, resizeTourImage} = require('../utils/uploadPhoto.js');

const tourRouter = express.Router(); // router not tourRouter

// app.use('/api/v1/tours', tourRouter);

// tourRouter.param('id', (req, res, next, val) => {
//     console.log(`Tour id is : ${val}`);
//     next();
// });

// tourRouter.param('id', tourController.checkID);

tourRouter.use('/:tourId/reviews', reviewRouter); // mounting a router

tourRouter.route('/top-5-cheap').get(aliasTopTours, tourController.getAllTours);

tourRouter.route('/tour-stats').get(tourController.getTourStats);
tourRouter
    .route('/monthly-plan/:year')
    .get(protect, restrictTo('admin', 'lead-guide', 'guide'), tourController.getMonthlyPlan);

tourRouter.route('/tours-within/:distance/center/:latlang/unit/:unit').get(tourController.getTourWithin);
// /tours-within?distance=233&center=-40,45&unit=mi
// /tours-within/233/center/-40,45/unit/mi

tourRouter.route('/distances/:latlang/unit/:unit').get(tourController.getDistances);

tourRouter
    .route('/')
    .get(tourController.getAllTours)
    .post(protect, restrictTo('admin', 'lead-guide'), tourController.createTour);

tourRouter
    .route('/:id')
    .get(tourController.getTourById)
    .patch(protect, restrictTo('admin', 'lead-guide'), uploadTourImages, resizeTourImage, tourController.updateTour)
    .delete(protect, restrictTo('admin', 'lead-guide'), tourController.deleteTour);

// // tourRouter.route('/:tourId/reviews').post(protect, restrictTo('user'), reviewController.createReview);

module.exports = tourRouter;

// !
// app.get('/api/v1/tours', getAllTours);
// app.get('/api/v1/tours/:id/:x?', getTourById);
// app.post('/api/v1/tours', createTour);
// app.patch('/api/v1/tours/:id', updateTour);
// app.delete('/api/v1/tours/:id', deleteTour);
