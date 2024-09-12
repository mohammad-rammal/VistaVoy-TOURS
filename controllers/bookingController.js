const catchAsync = require('../middlewares/catchAsync');
const Booking = require('../models/bookingModel');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const factory = require('./handlerFactory');
const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

/*********************
 * @ Get Checkout Session
 * GET
 **********************/
exports.getCheckoutSession = catchAsync(async (req, res, next) => {
    const user = await User.findOne({email: req.user.email});
    const tourID = await Tour.findById(req.params.tourId);

    // 1) Get the currently booked tour
    const tour = await Tour.findById(req.params.tourId);
    if (!tour) {
        return next(new AppError('No tour found with that ID', 404));
    }

    // 2) Create checkout session
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        // success_url: `${req.protocol}://${req.get('host')}/my-tours/?tour=${req.params.tourId}&user=${req.user.id}&price=${
        //     tour.price
        // }`,
        success_url: `${req.protocol}://${req.get('host')}/my-tours`,
        cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
        customer_email: req.user.email,
        client_reference_id: req.params.tourId,
        line_items: [
            {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: `${tour.name} Tour`,
                        description: `${tour.summary}`,
                        images: [`https://i.pinimg.com/736x/e4/8d/64/e48d64454f869adc050b0695f94f5d9f.jpg`],
                    },
                    unit_amount: tour.price * 100,
                },
                quantity: 1,
            },
        ],
        mode: 'payment',
    });

    res.status(200).json({
        status: 'success',
        sessionId: session.id,
    });
});

/*********************
 * @ Create Booking Checkout
 * GET
 **********************/
// exports.createBookingCheckout = catchAsync(async (req, res, next) => {
//     // Check if the required query parameters are provided
//     const {tour, user, price} = req.query;
//     if (!tour || !user || !price) {
//         return next();
//     }

//     // Fetch user and tour details securely
//     const userData = await User.findById(user);
//     const tourData = await Tour.findById(tour);
//     if (!userData || !tourData) {
//         return next();
//     }

//     // Create a new booking entry in the database
//     await Booking.create({tour, user, price});

//     // Create the redirect URL
//     const url = `${req.protocol}://${req.get('host')}/me`;

//     // Send payment confirmation email
//     await new Email(userData, url, tourData).sendPayment();

//     // Redirect the user to the original page without the query parameters
//     res.redirect(req.originalUrl.split('?')[0]);
// });
const createBookingCheckout = async (session) => {
    const tour = session.client_reference_id;
    const user = (await User.findOne({email: session.customer_email})).id;
    const price = session.line_items[0].amount / 100;

    await Booking.create({tour, user, price});
};

// Will run if payment successful and to create new booking into database
exports.webhookCheckout = async (req, res, next) => {
    const signature = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (error) {
        return res.status(400).send(`Webhook error: ${err.message}`);
    }

    if (event.type === 'checkout.session.complete') {
        createBookingCheckout(event.data.object);

        res.status(200).json({Received: true});
    }
};

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.createOne(Booking);
exports.getAllBooking = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
