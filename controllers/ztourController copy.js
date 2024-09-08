const fs = require('fs');
const Tour = require('../models/tourModel');

// ! Deleted Local
// ! // File direction
// filePath = `${__dirname}/../dev-data/data/tours-simple.json`;

// ! // Read File
// const toursName = JSON.parse(fs.readFileSync(filePath));

// exports.checkID = (req, res, next, val) => {
//     if (req.params.id * 1 > toursName.length || !(req.params.id * 1)) {
//         return res.status(404).json({
//             status: 'fail',
//             message: 'Not Found This ID',
//         });
//     }
//     next();
// };

// exports.checkBody = (req, res, next) => {
//     if (!req.body.name || !req.body.price) {
//         return res.status(400).json({
//             status: 'fail',
//             message: 'Missing Name or Price!',
//         });
//     }
//     next();
// };

/*********************
 * @ Get All
 * GET
 **********************/
exports.getAllTours = async (req, res) => {
    try {
        // 1 Filtering
        const queryObg = { ...req.query };
        const excludedFields = ['page', 'sort', 'limit', 'fields'];
        excludedFields.forEach((el) => delete queryObg[el]);

        // console.log(req.query, queryObg);
        // console.log(req.query);

        // 2 Advance Filtering
        let queryStr = JSON.stringify(queryObg);
        queryStr = queryStr.replace(
            /\b(gte|gt|lte|lt)\b/g,
            (match) => `$${match}`
        );
        //http://127.0.0.1:5000/api/v1/tours?duration[gte]=5&difficulty=easy&price[lt]=1500
        // Parse the modified query string back into an object
        const modifiedQueryObg = JSON.parse(queryStr);
        // console.log(JSON.parse(queryStr));

        // Now use the modified query object in your database query
        let queryResult = Tour.find(modifiedQueryObg);

        // 3 Sorting
        if (req.query.sort) {
            // queryResult = queryResult.sort(req.query.sort);

            const sortBy = req.query.sort.split(',').join(' ');
            // console.log(sortBy);
            queryResult = queryResult.sort(sortBy);
            //http://127.0.0.1:5000/api/v1/tours?sort=-price,-ratingsAverage
        } else {
            queryResult = queryResult.sort('-createdAt');
        }

        // 4 Field Limiting (projecting)
        if (req.query.fields) {
            const fields = req.query.fields.split(',').join(' '); // include the fields
            queryResult = queryResult.select(fields);
        } else {
            queryResult = queryResult.select('-__v'); // exclude these fields
        }

        // 5 Pagination
        const page = req.query.page * 1 || 1;
        const limit = req.query.limit * 1 || 100;
        const skip = (page - 1) * limit;

        queryResult = queryResult.skip(skip).limit(limit);

        if (req.query.page) {
            const numTours = await Tour.countDocuments();
            if (skip >= numTours) throw new Error('This page does not exist');
        }

        // http://127.0.0.1:5000/api/v1/tours?page=2&limit=10

        // const toursAll = await Tour.find()
        //     .where('duration')
        //     .equals(req.query.duration)
        //     .where('difficulty')
        //     .equals('easy');

        // 3 Execute Query

        const toursAll = await queryResult;
        //queryResult.sort().select().skip().limit()
        // Check pagination
        if (req.query.page) {
            const numTours = await Tour.countDocuments();
            if (features.query.skip >= numTours) {
                return res.status(404).json({
                    status: 'fail',
                    message: 'This page does not exist',
                });
            }
        }
        res.status(200).json({
            status: 'success',
            results: toursAll.length,
            data: {
                tours: toursAll,
            },
        });
    } catch (error) {
        res.status(404).json({
            status: 'fail',
            message: error,
        });
    }

    //! Before
    // console.log(req.requestTime);

    // res.status(200).json({
    //     status: 'success',
    //     results: toursName.length,
    //     requestedAt: req.requestTime,
    //     data: {
    //         tours: toursName,
    //     },
    // });
};

/*********************
 * @ Get By ID
 * GET
 **********************/
exports.getTourById = async (req, res) => {
    try {
        const tourId = await Tour.findById(req.params.id);

        res.status(201).json({
            status: 'success',
            data: {
                tour: tourId,
            },
        });
    } catch (error) {
        res.status(404).json({
            status: 'fail',
            message: err,
        });
    }

    // ! Before
    // console.log(req.params);

    // const idTour = req.params.id * 1;
    // const tourById = toursName.find((el) => el.id === idTour);

    // if (idTour > toursName.length || !tourById) {
    //     return res.status(404).json({
    //         status: 'fail',
    //         message: 'Not Found This ID',
    //     });
    // }

    // res.status(200).json({
    //     status: 'success',
    //     data: {
    //         tours: tourById,
    //     },
    // });
};

/*********************
 * @ Create
 * POST
 **********************/
exports.createTour = async (req, res) => {
    try {
        const newTour = await Tour.create(req.body);

        res.status(201).json({
            status: 'success',
            data: {
                tour: newTour,
            },
        });
    } catch (error) {
        res.status(400).json({
            status: 'fail',
            message: error,
        });
    }

    // ! console.log(req.body);

    // !const newId = toursName[toursName.length - 1].id;
    // !const newTour = Object.assign({ id: newId }, req.body);

    // !toursName.push(newTour);
    // fs.writeFile(filePath, JSON.stringify(toursName), (err) => {
    //     res.status(201).json({
    //         status: 'success',
    //         data: {
    //             tour: newTour,
    //         },
    //     });
    // });
};

/*********************
 * @ Update Tour
 * PATCH
 **********************/
exports.updateTour = async (req, res) => {
    try {
        const tourUpdated = await Tour.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true,
            }
        );

        res.status(200).json({
            status: 'success',
            data: {
                tour: tourUpdated,
            },
        });
    } catch (error) {
        res.status(404).json({
            status: 'fail',
            message: error,
        });
    }

    // ! Before
    // const idTour = req.params.id * 1;
    // const tourById = toursName.find((el) => el.id === idTour);

    // if (idTour > toursName.length || !tourById) {
    //     return res.status(404).json({
    //         status: 'fail',
    //         message: 'Not Found This ID',
    //     });
    // }

    // res.status(200).json({
    //     status: 'success',
    //     data: {
    //         tour: '<Updated tour here>',
    //     },
    // });
};

/*********************
 * @ Delete Tour
 * DELETE
 **********************/
exports.deleteTour = async (req, res) => {
    try {
        await Tour.findByIdAndDelete(req.params.id);

        res.status(204).json({
            status: 'success',
            data: null,
        });
    } catch (error) {
        res.status(404).json({
            status: 'fail',
            message: error,
        });
    }

    // ! Before
    // const idTour = req.params.id * 1;
    // const tourById = toursName.find((el) => el.id === idTour);
    //
    // if (idTour > toursName.length || !tourById) {
    //     return res.status(404).json({
    //         status: 'fail',
    //         message: 'Not Found This ID',
    //     });
    // }
    // res.status(204).send({
    //     status: 'success',
    //     data: null,
    // });
};
