const mongoose = require('mongoose');

const MONGO_DB = process.env.MONGODB_URL.replace(
    '<PASSWORD>',
    process.env.MONGODB_PASSWORD
);

const MONGO_LOCAL = process.env.MONGODB_LOCAL;
const connectDB = mongoose.connect(MONGO_DB).then((con) => {
    // console.log(con.connections);
    console.log('Successfully connected to MongoDB!');
});



module.exports = connectDB;
