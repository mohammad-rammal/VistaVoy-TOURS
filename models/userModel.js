const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please write your name'],
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'Please write your email'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please provide a valid email'],
        trim: true,
    },
    photo: {
        type: String,
        default: 'default.jpg',
    },
    role: {
        type: String,
        enum: ['user', 'guide', 'lead-guide', 'admin'],
        default: 'user',
    },
    password: {
        type: String,
        required: [true, 'Please write your password'],
        minLength: 8,
        select: false, // Hide from show to others from database
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Please repeat your password'],
        minLength: 8,
        validate: {
            // This only works on Create and SAVE! (not work in update)
            validator: function (el) {
                return el === this.password;
            },
            message: 'Passwords are not the same',
        },
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        default: true,
        select: false,
    },
});

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    this.password = await bcrypt.hash(this.password, 12);

    this.passwordConfirm = undefined;
    next();
});

// 3) Update changePasswordAt property for the user
userSchema.pre('save', function (next) {
    if (!this.isModified('password') || this.isNew) {
        return next();
    }

    this.passwordChangedAt = Date.now() - 1000;
    next();
});

// Show just active users not false!!!
userSchema.pre(/^find/, function (next) {
    // everything begin with find
    this.find({active: true});
    next();
});

userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimesTamp) {
    if (this.passwordChangedAt) {
        const changeTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        // console.log(changeTimestamp, JWTTimesTamp);
        return JWTTimesTamp < changeTimestamp;
    }

    // False means not changed
    return false;
};

userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
    // console.log({resetToken}, this.passwordResetToken, this.passwordResetExpires);
    return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
