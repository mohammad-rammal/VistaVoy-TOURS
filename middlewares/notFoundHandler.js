const AppError = require('../utils/appError');

const notFoundHandler = (req, res, next) => {
    // ? 1
    // res.status(404).json({
    //     status: 'fail',
    //     message: `Can't find ${req.originalUrl} on this server`
    // });
    //? 2
    // const err = new Error(`Can't find ${req.originalUrl} on this server`);
    // err.status = 'fail';
    // err.statusCode = 404;
    //next(err);

    // ? 3
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
};

module.exports = notFoundHandler;
