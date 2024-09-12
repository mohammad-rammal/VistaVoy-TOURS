const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const bodyParser = require('body-parser');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const viewRouter = require('./routes/viewRoutes');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const bookingController = require('./controllers/bookingController');
const notFoundHandler = require('./middlewares/notFoundHandler');
const errorHandler = require('./middlewares/errorHandler');
const sendEmail = require('./utils/email');

const app = express();

// app.enable('trust proxy') // for express heroku for secure:req.secure || req.headers['x-forwarded-proto'] === 'https' in authController to test in connection is secure
app.use(cookieParser()); // Parser data from cookie

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

// Use CORS middleware
const corsOptions = {
    origin: 'http://localhost:5000', // Ensure this matches your frontend URL
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true, // Ensure this is set to true
};

app.use(cors(corsOptions));

app.options('*', cors());
// app.options('/api/v1/', cors()); this route must have cors

// Helmet (Security HTTP headers)
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", 'https://unpkg.com', 'https://js.stripe.com'],
            styleSrc: ["'self'", 'https://unpkg.com', 'https://fonts.googleapis.com'],
            fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'", 'http://127.0.0.1:5000'],
            frameSrc: ["'self'", 'https://js.stripe.com'],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: [],
        },
    })
);

// app.use(
//     helmet.contentSecurityPolicy({
//         directives: {
//             defaultSrc: ["'self'"],
//             scriptSrc: ["'self'", 'https://unpkg.com'],
//             scriptSrc: ["'self'", 'https://unpkg.com', 'https://js.stripe.com'],
//             styleSrc: ["'self'", 'https://unpkg.com', 'https://fonts.googleapis.com'],
//             fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
//             imgSrc: ["'self'", 'data:', 'https:'],
//             connectSrc: ["'self'", 'http://127.0.0.1:5000'],
//             objectSrc: ["'none'"],
//             upgradeInsecureRequests: [],
//         },
//     })
// );

// Middlewares
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

//  Access 100 request for 1 ip for one hour (Deny Of Server -DOS- and brute Force Attack)
const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: 'To many requests from this IP, please try again in an hour!',
});

// Make limiter middleware effect at /api routes only
app.use('/api', limiter);

app.post('/webhook-checkout', bodyParser.raw({type: 'application/json'}), bookingController.webhookCheckout); // will receive req not json and then will go to body parser to convert to json

// Apply middleware for post (body parser , reading data from body into req.body)
app.use(express.json({limit: '10kb'}));
app.use(express.urlencoded({extended: true, limit: '10kb'}));

// Data sanitization against NoSQL query injection (Malicious malware)
app.use(mongoSanitize());

// Data sanitization against XSS (protect from HTML code in input)
app.use(xss());

// HTTP Parameter Pollution attacks (Delete duplicates in HTTP request & just keep the second)
app.use(
    hpp({
        whitelist: ['duration', 'maxGroupSize', 'difficulty', 'ratingsQuantity', 'ratingsAverage', 'price'],
    })
);

// Text compressions
app.use(compression());

// Serving static files
// app.use(express.static(`${__dirname}/public`)); //http://127.0.0.1:5000/overview.html

app.use((req, res, next) => {
    console.log('Hello from middleware ❤️');
    next();
});

// app.use((req, res, next) => {
//     console.log('Incoming Cookies:', req.cookies); // Log cookies
//     console.log('Headers:', req.headers); // Log headers

//     next();
// });

app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    // console.log('Request Time:', req.requestTime);
    next();
});

// Routers (API)
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);
// app.get('/test-cookie', (req, res) => {
//     res.cookie('test', 'cookie', {maxAge: 900000, httpOnly: true});
//     res.send('Cookie has been set');
// });

app.all('*', notFoundHandler);

app.use(errorHandler);
app.set('trust proxy', true);
module.exports = app;
