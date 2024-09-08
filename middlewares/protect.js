const {promisify} = require('util');
const AppError = require('../utils/appError');
const catchAsync = require('./catchAsync');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

exports.protect = catchAsync(async (req, res, next) => {
    let token;

    // 1) Get token and check if there
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
        token = req.cookies.jwt;
    }

    if (!token) {
        return next(new AppError('You are not logged in! Please log in to get access ', 401));
    }

    // 2) Validate token (Verification)
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3) If verification (user still exists)
    const freshUser = await User.findById(decoded.id);
    if (!freshUser) {
        return next(new AppError('The user belonging to this token does no longer exist.', 401));
    }

    // 4) Check if user changed password after token was issued
    if (freshUser.changedPasswordAfter(decoded.iat)) {
        return next(new AppError('User recently changed password! Please log in again.', 401));
    }

    req.user = freshUser;

    next();
});

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new AppError('You do not have permission to perform this action.', 403));
        }

        next();
    };
};

//Only for rendered pages, no errors!
exports.isLoggedIn = async (req, res, next) => {
    // 1) Get token and check if there
    if (req.cookies.jwt) {
        try {
            // 2) Validate token (Verification)
            const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);

            // 3) If verification (user still exists)
            const currentUser = await User.findById(decoded.id);
            if (!currentUser) {
                return next();
            }

            // 4) Check if user changed password after token was issued
            if (currentUser.changedPasswordAfter(decoded.iat)) {
                return next();
            }

            // There is a logged in user
            res.locals.user = currentUser;
            return next();
        } catch (error) {
            return next();
        }
    }
    next();
};
