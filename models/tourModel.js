const mongoose = require('mongoose');
const slugify = require('slugify');
const User = require('./userModel');
// const validator = require('validator');

const tourSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'A tour must have a name'],
            unique: true,
            trim: true,
            minLength: [10, 'A tour name must have more or equal then 10 characters'],
            maxLength: [40, 'A tour name must have less or equal then 40 characters'],
            // validate: [
            //     validator.isAlpha,
            //     'Tour name must only contain characters',
            // ], bz will consider the spaces chars and that wrong
        },
        slug: String,
        duration: {
            type: Number,
            required: [true, 'A tour must have a duration'],
        },
        maxGroupSize: {
            type: Number,
            required: [true, 'A tour must have a group size'],
        },
        difficulty: {
            type: String,
            required: [true, 'A tour must have a difficulty'],
            enum: {
                values: ['easy', 'medium', 'difficult'],
                message: 'difficulty is either: easy, medium, difficult', // just for string
            },
        },
        ratingsAverage: {
            type: Number,
            default: 4.5,
            min: [1, 'Rating must be above 1.0'], // also min used for date
            max: [5, 'Rating must be below 5.0'],
            set: (val) => Math.round(val * 100) / 100,
        },
        ratingsQuantity: {
            type: Number,
            default: 0,
        },
        price: {
            type: Number,
            required: [true, 'A tour must have a price'],
        },
        priceDiscount: {
            type: Number,
            validate: {
                validator: function (val) {
                    // this only points to current doc on new document creation
                    return val < this.price;
                },
                message: 'Discount price ({value}) should be below regular price',
            },
        },
        summary: {
            type: String,
            trim: true, // only for string
            required: [true, 'A tour must have a summary'],
        },
        description: {
            type: String,
            trim: true,
        },
        imageCover: {
            type: String,
            required: [true, 'A tour must have an image cover'],
        },
        images: [String],
        createdAt: {
            type: Date,
            default: Date.now(),
            select: false, // remove from show results (postman)
        },
        startDates: [Date],
        secretTour: {
            type: Boolean,
            default: false,
        },
        startLocation: {
            // GeoJSON
            type: {
                type: String,
                default: 'Point',
                enum: ['Point'],
            },
            coordinates: [Number],
            address: String,
            description: String,
        },
        locations: [
            {
                type: {
                    type: String,
                    default: 'Point',
                    enum: ['Point'],
                },
                coordinates: [Number],
                address: String,
                description: String,
                day: Number,
            },
        ],
        // // Embedding save data
        // // guides: Array,
        guides: [
            {
                type: mongoose.Schema.ObjectId,
                ref: 'User',
            },
        ],
    },
    {
        toJSON: {virtuals: true},
        toObject: {virtuals: true},
        timestamps: true,
    }
);

// Speed up and more performance when make sort
// tourSchema.index({price: 1}); //-1 descending order
tourSchema.index({price: 1, ratingsAverage: -1}); //-1 descending order
tourSchema.index({slug: 1});
tourSchema.index({startLocation: '2dsphere'});

tourSchema.virtual('durationWeeks').get(function () {
    return this.duration / 7;
});

// Virtual populate
tourSchema.virtual('reviews', {
    ref: 'Review',
    foreignField: 'tour',
    localField: '_id',
});

// Document Middleware: runs >>|before|<< .save() and .create() but not for .insertMany()
tourSchema.pre('save', function (next) {
    console.log(this);
    this.slug = slugify(this.name, {lower: true}); // this for document
    next();
});

// Embedding save data
tourSchema.pre('save', async function (next) {
    const guidesPromises = this.guides.map(async (id) => await User.findById(id));
    this.guides = await Promise.all(guidesPromises);
    next();
});

//? After
// tourSchema.pre('save', function (next) {
//     console.log('Will save document..');
//     next();
// });
// After
// tourSchema.post('save', function (doc, next) {
//     console.log(doc);
//     next();
// });

// tourSchema.pre('find', function (next) {
tourSchema.pre(/^find/, function (next) {
    //^ all strings start by find
    this.find({secretTour: {$ne: true}}); // this for query

    // this.start = Date.now();
    next();
});

tourSchema.pre(/^find/, function (next) {
    this.populate({
        path: 'guides', // populate as embedded
        select: '-__v -durationWeeks -passwordChangedAt', // to hide from show
    });
    next();
});

// tourSchema.post(/^find/, function (docs, next) {
//     console.log(`Query took ${Date.now() - this.start} ms`);
//     console.log(docs);
//     next();
// });

// Aggregation Middleware
// tourSchema.pre('aggregate', function (next) {
//     this.pipeline().unshift({
//         $match: {secretTour: {$ne: true}},
//     });
//     console.log(this.pipeline());
//     next();
// });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
