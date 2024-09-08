const mongoose = require('mongoose');
const dotenv = require('dotenv');
const uncaughtException = require('./middlewares/uncaughtException');

process.on('uncaughtException', uncaughtException);

dotenv.config({ path: './config.env' });

const app = require('./app');
const connectDB = require('./connection/connectDB');
// console.log(process.env);

connectDB;

// const testTour = new Tour({
//     name: 'The Forest Hiker 2',
//     rating: 4.72,
//     price: 497,
// });
// testTour
//     .save()
//     .then((doc) => {
//         console.log(doc);
//     })
//     .catch((err) => {
//         console.error('ERROR 😭:', err.message);
//     });

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log(`Running port on ${PORT} in ${process.env.NODE_ENV} mode...`);
});

process.on('unhandledRejection', (err) => {
    console.log(err.name, err.message);

    console.log('UNHANDLED REJECTION! 💥 Shutting down...');
    server.close(() => {
        process.exit(1); // 0 success , 1 failure
    });
});
