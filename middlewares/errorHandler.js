const AppError = require('../utils/appError');

const handleCastErrorDB = (err) => {
    const message = `Invalid ${err.path}: ${err.value}.`;
    return new AppError(message, 400);
};

const handleDuplicateField = (err) => {
    const value = err.errorResponse.errmsg.match(/(["'])(?:(?=(\\?))\2.)*?\1/);

    const message = `Duplicate field value: ${value}. Please use another value!`;

    return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
    const errors = Object.values(err.errors).map((el) => el.message);

    const message = `Invalid input data. ${errors.join('. ')}`;

    return new AppError(message, 400);
};

const handleJWTError = (err) => {
    return new AppError('You token has been expired!. Please log in again!', 401);
};

const handleJWTExpiredError = (err) => {
    return new AppError('Invalid token. Please log in again!', 401);
};

const sendErrorDev = (err, req, res) => {
    // API
    if (req.originalUrl.startsWith('/api')) {
        res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack,
        });
    } else {
        // Rendered website
        console.log('Error 🔥', err);

        res.status(err.statusCode).render('error', {
            title: 'Something went wrong!',
            msg: err.message,
        });
    }
};

const sendErrorPro = (err, req, res) => {
    if (req.originalUrl.startsWith('/api')) {
        if (err.isOperational) {
            res.status(err.statusCode).json({
                status: err.status,
                message: err.message,
            });
        } else {
            console.log('Error 🔥', err);

            res.status(err.statusCode).render('error', {
                title: 'Something went wrong!',
                msg: err.message,
            });
        }
    } else {
        // Rendered website
        if (err.isOperational) {
            res.status(err.statusCode).json({
                status: err.status,
                message: err.message,
            });
        } else {
            console.log('Error 🔥', err);

            res.status(err.statusCode).render('error', {
                title: 'Something went wrong!',
                msg: 'Please try again later',
            });
        }
    }
};

const errorHandler = (err, req, res, next) => {
    // console.log(err.stack);

    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, req, res);
    } else if (process.env.NODE_ENV === 'production') {
        let error = {...err};
        error.message = err.message;
        if (err.name === 'CastError') {
            error = handleCastErrorDB(error);
        }
        if (err.code === 11000) {
            error = handleDuplicateField(error);
        }
        if (err.name === 'ValidationError') {
            error = handleValidationErrorDB(error);
        }
        if (err.name === 'JsonWebTokenError') {
            error = handleJWTError(error);
        }
        if (err.name === 'TokenExpiredError') {
            error = handleJWTExpiredError(error);
        }

        sendErrorPro(error, req, res);
    }
};

module.exports = errorHandler;
