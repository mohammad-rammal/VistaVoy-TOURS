const catchAsync = require('../middlewares/catchAsync');
const Booking = require('../models/bookingModel');
const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const AppError = require('../utils/appError');

exports.alerts = (req, res, next) => {
    const {alert} = req.query;
    if (alert === 'booking')
        res.locals.alert = 'Your booking was successful! Please check your email for a confirmation.';

    next();
};

exports.getOverView = catchAsync(async (req, res, next) => {
    // 1) Get tour data from collection
    const toursAll = await Tour.find();

    // 2) Build template
    // 3) Render that template using tour data from 1
    res.status(200).render('overview', {
        title: 'All tours',
        tours: toursAll,
    });
});

exports.getTour = catchAsync(async (req, res, next) => {
    // 1) Get the data, for the requested tour (including reviews and guides)
    const tourSlug = await Tour.findOne({slug: req.params.slug}).populate({
        path: 'reviews',
        fields: 'review rating user',
    });
    // console.log(tourSlug);

    if (!tourSlug) {
        return next(new AppError('There is no tour with that name.', 404));
    }
    // 2) Build template
    // 3) Render that template using data from 1
    res.status(200).render('tour', {
        title: `${tourSlug.name} tour`,
        tour: tourSlug,
    });
});

exports.getLoginForm = (req, res) => {
    res.status(200).render('login', {
        title: 'Login',
    });
};

exports.getSignUpForm = (req, res) => {
    res.status(200).render('signup', {
        title: 'Sign Up',
    });
};

exports.getAccount = async (req, res) => {
    res.status(200).render('account', {
        title: 'Your account',
    });
};

exports.getMyTours = catchAsync(async (req, res) => {
    // 1) Find all bookings
    const bookings = await Booking.find({user: req.user.id});

    // 2) Find tours with the returned IDs
    const tourIDs = bookings.map((el) => el.tour);
    const tours = await Tour.find({_id: {$in: tourIDs}});

    res.status(200).render('overview', {
        title: 'My Bookings',
        tours,
    });
});

exports.updateUserData = catchAsync(async (req, res, next) => {
    const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        {
            name: req.body.name,
            email: req.body.email,
        },
        {
            new: true,
            runValidators: true,
        }
    );

    res.status(200).render('account', {
        title: 'My Profile',
        user: updatedUser,
    });
});
