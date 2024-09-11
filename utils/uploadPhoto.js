const multer = require('multer');
const sharp = require('sharp');
const AppError = require('./appError');
const catchAsync = require('../middlewares/catchAsync');

// const multerStorage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, 'public/img/users');
//     },
//     filename: (req, file, cb) => {
//         const ext = file.mimetype.split('/')[1];
//         const date = new Date().toISOString().replace(/:/g, '-').split('.')[0];
//         cb(null, `user-${req.user.id}-${date}.${ext}`);
//     },
// });

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(new (AppError('Not an image! Please upload only images.', 400))(), false);
    }
};

const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter,
});

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
    if (!req.file) {
        return next();
    }

    const date = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    req.file.filename = `user-${req.user.id}-${date}.jpeg`;

    await sharp(req.file.buffer)
        .resize(500, 500)
        .toFormat('jpeg')
        .jpeg({quality: 90})
        .toFile(`public/img/users/${req.file.filename}`);
    next();
});

// For Multi

exports.resizeTourImage = catchAsync(async (req, res, next) => {
    // console.log(req.files);

    if (!req.files.imageCover || !req.files.images) {
        return next();
    }

    const date = new Date().toISOString().replace(/:/g, '-').split('.')[0];

    // 1) Image Cover
    req.body.imageCover = `tour-${req.params.id}-${date}-cover.jpeg`;
    await sharp(req.files.imageCover[0].buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({quality: 90})
        .toFile(`public/img/tours/${req.body.imageCover}`);

    // 2) Images
    req.body.images = [];
    await Promise.all(
        req.files.images.map(async (file, index) => {
            const fileName = `tour-${req.params.id}-${date}-${index + 1}.jpeg`;

            await sharp(req.files.images[`${index}`].buffer)
                .resize(2000, 1333)
                .toFormat('jpeg')
                .jpeg({quality: 90})
                .toFile(`public/img/tours/${fileName}`);

            req.body.images.push(fileName);
        })
    );

    next();
});

exports.uploadTourImages = upload.fields([
    {
        name: 'imageCover',
        maxCount: 1,
    },
    {
        name: 'images',
        maxCount: 3,
    },
]);
