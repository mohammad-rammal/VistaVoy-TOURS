const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const catchAsync = require('../middlewares/catchAsync');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

const generateToken = (id) => {
    return jwt.sign({id: id}, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });
};

const cookieOptions = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' ? true : false, // Secure only in production
    sameSite: 'Lax', // Helps with cross-site requests

    // if(req.secure || req.headers['x-forwarded-proto'] === 'https') cookieOptions.secure = true;
    // secure:req.secure || req.headers['x-forwarded-proto'] === 'https'
};

if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true; // Set to true for HTTPS
}


const createSendToken = (user, statusCode, res) => {
    const token = generateToken(user._id);

    res.cookie('jwt', token, cookieOptions);

    // res.cookie('jwt', token, {
    //     expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
    //     httpOnly: true,
    //     secure:req.secure || req.headers['x-forwarded-proto'] === 'https'
    // });
    // console.log('Cookie Set:', token); // Add this line for debugging

    user.password = undefined;

    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user,
        },
    });
};

/*********************
 * @ Create New User
 * POST
 **********************/
exports.signup = catchAsync(async (req, res, next) => {
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        passwordChangedAt: req.body.passwordChangedAt,
    });

    const url = `${req.protocol}://${req.get('host')}/me`;
    // console.log(url);

    await new Email(newUser, url).sendWelcome();

    // const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
    //     expiresIn: process.env.JWT_EXPIRES_IN,
    // });

    createSendToken(newUser, 201, res);
    // createSendToken(newUser, 201, req,res);

    // const token = generateToken(newUser._id);

    // res.status(201).json({
    //     status: 'success',
    //     token,
    //     data: {
    //         user: newUser,
    //     },
    // });
});

/*********************
 * @ Login User
 * POST
 **********************/
exports.login = catchAsync(async (req, res, next) => {
    const {email, password} = req.body;

    // 1) Check if email and password exist
    if (!email || !password) {
        return next(new AppError('Please provide email and password!', 400));
    }

    // 2) Check if user exists and password correct
    const user = await User.findOne({email: email}).select('+password'); // to show again the password after make select false in userModel
    if (!user) {
        return next(new AppError('Incorrect email or password', 401)); // unauthorized
    }

    const correct = await user.correctPassword(password, user.password);
    if (!correct) {
        return next(new AppError('Incorrect email or password', 401)); // unauthorized
    }

    // 3) If everything correct then send token to client
    createSendToken(user, 200, res);

    // const token = generateToken(user._id);

    // res.status(200).json({
    //     status: 'success',
    //     token,
    // });
});

/*********************
 * @ Logout User
 * GET
 **********************/
/*********************
 * @ Logout User
 * GET
 **********************/
exports.logout = (req, res) => {
    res.cookie('jwt', '', {
        expires: new Date(0), // Set expiration to the past to remove the cookie
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax',
        path: '/', // Ensure the cookie is removed from all paths
    });
    res.status(200).json({status: 'success'});
};

/*********************
 * @ Forgot Password (Send Email Forgot)
 * POST
 **********************/
exports.forgotPassword = catchAsync(async (req, res, next) => {
    const {email} = req.body;

    // 1) Check if email and password exist
    if (!email) {
        return next(new AppError('Please provide email!', 400));
    }

    // 2) Get user based on POSTed email
    const user = await User.findOne({email: req.body.email});

    if (!user) {
        return next(new AppError('There is no user with email address.', 404));
    }

    // 3) Generate the random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({validateBeforeSave: false});

    // const message = `
    //     <div style="font-family: Arial, sans-serif; color: #333; padding: 20px; background-color: #f9f9f9; border: 1px solid #ddd; border-radius: 8px;">
    //         <h2 style="color: #2c3e50;">Forgot Your Password?</h2>
    //         <p style="font-size: 16px; line-height: 1.6;">
    //         No worries! 🌟 To reset your password, please submit a PATCH request with your new password and password confirmation to:
    //         </p>
    //         <p style="font-size: 16px; line-height: 1.6;">
    //         <a href="${resetURL}" style="color: #3498db; text-decoration: none;">${resetURL}</a>
    //         </p>
    //         <p style="font-size: 16px; line-height: 1.6;">
    //         If you didn’t request a password change, simply ignore this email. No further action is needed from your side. 😊
    //         </p>
    //         <p style="font-size: 14px; color: #888;">
    //         Stay secure and have a great day!
    //         </p>
    //     </div>
    //     `;

    try {
        // 4) Send it to user's email
        const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;

        // await sendEmail({
        //     email: user.email,
        //     subject: 'Your password reset token (valid for 10 mins)',
        //     message,
        // });

        await new Email(user, resetURL).sendPasswordReset();
        res.status(200).json({
            status: 'success',
            message: 'Token sent to email',
        });
    } catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({validateBeforeSave: false});

        return next(new AppError('There was an error sending the email. Try again later!', 500)); // Error from server
    }
});

/*********************
 * @ Reset Password
 * PATCH
 **********************/
exports.resetPassword = catchAsync(async (req, res, next) => {
    // 1) Get user based on the token
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({passwordResetToken: hashedToken, passwordResetExpires: {$gte: Date.now()}});

    // 2) If token has not expired, and there is user, set the new password
    if (!user) {
        return next(new AppError('Token is invalid or has expired', 400));
    }
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    // 3) Update changePasswordAt property for the user (In userModel Middleware)
    // 4) Log the user in, send JWT
    createSendToken(user, 200, res);

    // const token = generateToken(user._id); // Changed from newUser._id to user._id

    // res.status(201).json({
    //     status: 'success',
    //     token,
    // });
});

/*********************
 * @ Update Password
 * PATCH
 **********************/
exports.updatePassword = catchAsync(async (req, res, next) => {
    const {passwordCurrent, password, passwordConfirm} = req.body;
    if (!passwordCurrent || !password || !passwordConfirm) {
        return next(new AppError('Missing fields!', 400));
    }

    // 1) Get user from collection
    const user = await User.findById(req.user.id).select('+password');

    // 2) Check if POSTed current password is correct
    if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
        return next(new AppError('Your current password is wrong.', 401));
    }

    // 3) If so, update password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;

    await user.save();

    // 4) Log user in, send JWT
    createSendToken(user, 200, res);
});
