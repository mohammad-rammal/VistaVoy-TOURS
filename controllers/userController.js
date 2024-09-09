const fs = require('fs');

const catchAsync = require('../middlewares/catchAsync');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

// filePath = `${__dirname}/../dev-data/data/tours-simple.json`;

// // Read File
// const toursName = JSON.parse(fs.readFileSync(filePath));

const filterObj = (obj, ...allowedFields) => {
    const newObj = {};

    Object.keys(obj).forEach((el) => {
        if (allowedFields.includes(el)) {
            newObj[el] = obj[el];
        }
    });

    return newObj;
};

/*********************
 * @ Get All Users
 * GET
 **********************/
exports.getAllUsers = factory.getAll(User);
// exports.getAllUsers = catchAsync(async (req, res, next) => {
//     const users = await User.find();

//     res.status(200).json({
//         status: 'success',
//         results: users.length,
//         data: {
//             users: users,
//         },
//     });
// });

/*********************
 * @ Update My Data
 * PATCH
 **********************/
exports.updateMe = catchAsync(async (req, res, next) => {
    // console.log(req.file);
    // console.log(req.body);

    // 1) Create error if user POSTed password data
    if (req.body.password || req.body.passwordConfirm) {
        // If it does, return an error using the next function
        return next(new AppError('This route is not for password updates. Please use /updateMyPassword.', 400));
    }

    // 2) Update user document
    const filteredBody = filterObj(req.body, 'name', 'email');

    if (req.file) {
        filteredBody.photo = req.file.filename;
    }

    const updateUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {new: true, runValidators: true}).select(
        '-passwordChangedAt'
    );

    // If no password fields are present, send a success response
    res.status(200).json({
        status: 'success',
        data: {
            user: updateUser,
        },
    });
});

/*********************
 * @ Delete Me (Deactivate  User)
 * DELETE
 **********************/
exports.deleteMe = catchAsync(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user.id, {active: false});

    res.status(204).json({
        status: 'success',
        data: null,
    });
});

/*********************
 * @ Create User
 * POST
 **********************/
exports.createUser = (req, res) => {
    res.status(500).json({
        status: 'err',
        message: 'This route is not defined! Please use /signup instead.',
    });
};

/*********************
 * @ Get User
 * GET
 **********************/
exports.getMe = (req, res, next) => {
    req.params.id = req.user.id;
    next();
};
exports.getUserById = factory.getOne(User);

/*********************
 * @ Update User
 * PATCH
 **********************/
exports.updateUser = factory.updateOne(User);
// No Change Password using update user bz will not run safe middlewares//

/*********************
 * @ delete User
 * DELETE
 **********************/
exports.deleteUser = factory.deleteOne(User);
