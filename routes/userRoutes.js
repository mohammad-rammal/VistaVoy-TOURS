const userController = require('../controllers/userController.js');
const authController = require('../controllers/authController.js');
const express = require('express');
const {restrictTo, protect} = require('../middlewares/protect.js');
const app = express();
// File direction

const router = express.Router();

// app.use('/api/v1/users', userRouter); // mounting router

router.route('/signup').post(authController.signup);
router.route('/login').post(authController.login);
router.route('/logout').get(authController.logout);

router.route('/forgotPassword').post(authController.forgotPassword);
router.route('/resetPassword/:token').patch(authController.resetPassword);

// Middleware to active PROTECT for all
router.use(protect);
router.route('/updateMyPassword').patch(authController.updatePassword);
router.route('/me').get(userController.getMe, userController.getUserById);
router.route('/updateMe').patch(userController.updateMe);
router.route('/deleteMe').delete(userController.deleteMe);

// Middleware to active RESTRICT for all
router.use(restrictTo('admin'));
router.route('/').get(userController.getAllUsers).post(userController.createUser);
router.route('/:id').get(userController.getUserById).patch(userController.updateUser).delete(userController.deleteUser);

module.exports = router;
