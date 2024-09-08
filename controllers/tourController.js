const fs = require('fs');
const Tour = require('../models/tourModel');
const catchAsync = require('../middlewares/catchAsync');
const AppError = require('../utils/appError');

const factory = require('./handlerFactory');
const {diffieHellman} = require('crypto');

/*********************
 * @ Get All
 * GET
 **********************/
exports.getAllTours = factory.getAll(Tour);
// exports.getAllTours = catchAsync(async (req, res, next) => {
//     // console.log(req.query);
//     // Initialize APIFeatures with Tour.find() and req.query
//     const features = new APIFeatures(Tour.find(), req.query).filter().sort().limitFields().paginate();

//     // Execute the query
//     const toursAll = await features.query;

//     res.status(200).json({
//         status: 'success',
//         results: toursAll.length,
//         data: {
//             tours: toursAll,
//         },
//     });
// });

/*********************
 * @ Get By ID
 * GET
 **********************/
exports.getTourById = factory.getOne(Tour, {path: 'reviews'}); // {path: '',select:''}
// exports.getTourById = catchAsync(async (req, res, next) => {
//     const tourId = await Tour.findById(req.params.id).populate('reviews');

//     if (!tourId) {
//         return next(new AppError(`No tour found with ID ${req.params.id}`, 404));
//     }
//     res.status(201).json({
//         status: 'success',
//         data: {
//             tour: tourId,
//         },
//     });
// });

/*********************
 * @ Create
 * POST
 **********************/
exports.createTour = factory.createOne(Tour);
// exports.createTour = catchAsync(async (req, res, next) => {
//     const newTour = await Tour.create(req.body);

//     res.status(201).json({
//         status: 'success',
//         data: {
//             tour: newTour,
//         },
//     });
// });

/*********************
 * @ Update Tour
 * PATCH
 **********************/
exports.updateTour = factory.updateOne(Tour);
// exports.updateTour = catchAsync(async (req, res, next) => {
//     const tourUpdated = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//         new: true,
//         runValidators: true,
//     });
//     if (!tourUpdated) {
//         return next(new AppError(`No tour found with ID ${req.params.id}`, 404));
//     }
//     res.status(200).json({
//         status: 'success',
//         data: {
//             tour: tourUpdated,
//         },
//     });
// });

/*********************
 * @ Delete Tour
 * DELETE
 **********************/
exports.deleteTour = factory.deleteOne(Tour);
// exports.deleteTour = catchAsync(async (req, res, next) => {
//     const tourDelete = await Tour.findByIdAndDelete(req.params.id);

//     if (!tourDelete) {
//         return next(new AppError(`No tour found with ID ${req.params.id}`, 404));
//     }

//     res.status(204).json({
//         status: 'success',
//         data: null,
//     });
// });

/*********************
 * @ Get Stats
 * GET
 **********************/
exports.getTourStats = catchAsync(async (req, res, next) => {
    const stats = await Tour.aggregate([
        {
            $match: {ratingsAverage: {$gte: 4.5}},
        },
        {
            $group: {
                _id: {$toUpper: '$ratingsAverage'},
                num: {$sum: 1},
                numRatings: {$sum: '$ratingsQuantity'},
                avgRating: {$avg: '$ratingsAverage'},
                avgPrice: {$avg: '$price'},
                minPrice: {$min: '$price'},
                maxPrice: {$max: '$price'},
            },
        },
        {
            $sort: {avgPrice: 1}, //1 accending
        },
        {
            $match: {_id: {$ne: 'EASY'}},
        },
    ]);
    res.status(200).json({
        status: 'success',
        data: {
            stats,
        },
    });
});

/*********************
 * @ Get Monthly Plan
 * GET
 **********************/
exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
    const year = req.params.year * 1;

    const plan = await Tour.aggregate([
        {
            $unwind: '$startDates',
        },
        {
            $match: {
                startDates: {
                    $gte: new Date(`${year}-01-01`),
                    $lte: new Date(`${year}-12-31`),
                },
            },
        },
        {
            $group: {
                _id: {$month: '$startDates'}, // select month and extract details from startDates
                numTourStarts: {$sum: 1},
                tours: {$push: '$name'},
            },
        },
        {
            // {
            //     $addFields: { month: '$_id' },
            // },
            $addFields: {
                monthName: {
                    $dateToString: {
                        format: '%B',
                        date: {
                            $dateFromParts: {
                                year,
                                month: '$_id',
                            },
                        },
                    },
                },
            },
        },

        {
            $project: {
                // 0 hide , 1 show
                _id: 0,
            },
        },
        {
            $sort: {numTourStarts: -1},
        },
        {
            $limit: 6, // limit the results
        },
    ]);

    res.status(200).json({
        status: 'success',
        results: plan.length,
        data: {
            plan,
        },
    });
});

/*********************
 * @ Get Tour Within
 * GET
 * /tours-within/233/center/33.894301, 35.499604/unit/mi
 ***********************/
exports.getTourWithin = catchAsync(async (req, res, next) => {
    const {distance, latlang, unit} = req.params;
    const [lat, lang] = latlang.split(',');

    const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

    if (!lat || !lang) {
        next(new AppError('Please provide latitude and longitude in the format lat,lag.', 400));
    }

    // console.log(distance, lat, lang, unit);

    const tours = await Tour.find({startLocation: {$geoWithin: {$centerSphere: [[lat, lang], radius]}}});

    res.status(200).json({
        status: 'success',
        results: tours.length,
        data: {
            data: tours,
        },
    });
});

/*********************
 * @ Get Tour Within
 * GET
 ***********************/
exports.getDistances = catchAsync(async (req, res, next) => {
    const {latlang, unit} = req.params;
    const [lat, lang] = latlang.split(',');

    const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

    if (!lat || !lang) {
        next(new AppError('Please provide latitude and longitude in the format lat,lag.', 400));
    }

    const distances = await Tour.aggregate([
        {
            // need the index in tourModel
            $geoNear: {
                // must be first
                near: {
                    type: 'Point',
                    coordinates: [lang * 1, lat * 1],
                },
                distanceField: 'distance',
                distanceMultiplier: multiplier,
            },
        },
        {
            $project: {
                distance: 1,
                name: 1, //1 to keep it
            }, //keep this field only
        },
    ]);

    res.status(200).json({
        status: 'success',
        results: distances.length,
        data: {
            data: distances,
        },
    });
});
