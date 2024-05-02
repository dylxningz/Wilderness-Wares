const UserModel = require('../models/userModel');
const OfferModel = require('../models/offerModel');
const bcrypt = require('bcryptjs');

exports.getSignupForm = (req, res) => {
    res.render('users/signup');
};

exports.signup = async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const newUser = await UserModel.create({
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            password: hashedPassword
        });
        req.session.user = newUser;
        req.flash('success', 'Signup successful! Welcome to Wilderness Wares.');
        res.redirect('/users/profile');
    } catch (error) {
        if (error.name === 'MongoError' && error.code === 11000) {
            req.flash('error', 'Email already exists. Please try another one.');
            return res.redirect('/users/signup');
        } else if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).reduce((acc, err) => {
                acc.push(err.message);
                return acc;
            }, []);

            messages.forEach(msg => req.flash('error', msg));
            return res.redirect('/users/signup');
        } else {
            console.error('Error during signup:', error);
            req.flash('error', 'Error creating user, please try again.');
            return res.status(500).redirect('/users/signup');
        }
    }
};

exports.getLoginForm = (req, res) => {
    res.render('users/login');
};

exports.login = async (req, res) => {
    try {
        const user = await UserModel.findOne({ email: req.body.email });
        if (user && await bcrypt.compare(req.body.password, user.password)) {
            req.session.user = user;
            req.flash('success', 'Successfully logged in.');
            res.redirect('/users/profile');
        } else {
            req.flash('error', 'Invalid email or password.');
            res.redirect('/users/login');
        }
    } catch (error) {
        console.error('Error during login:', error);
        req.flash('error', 'Authentication failed. Please try again.');
        res.status(500).redirect('/users/login');
    }
};

exports.getProfile = async (req, res) => {
    if (!req.session.user) {
        req.flash('error', 'You need to log in to view your profile.');
        return res.redirect('/users/login');
    }

    try {
        const user = await UserModel.findById(req.session.user._id).populate('items');
        if (!user) {
            req.flash('error', 'User not found.');
            return res.status(404).redirect('/users/login');
        }

        const offersMade = await OfferModel.find({ user: req.session.user._id }).populate({
            path: 'item',
            select: 'title active'
        });

        res.render('users/profile', { user, offersMade });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        req.flash('error', 'Internal server error while fetching profile.');
        res.status(500).redirect('/users/profile');
    }
};

exports.logout = (req, res) => {
    if (req.session) {
        req.session.destroy(err => {
            if (err) {
                req.flash('error', 'Failed to log out.');
                return res.redirect('/users/profile'); 
            }
            res.cookie('message', 'You have been logged out successfully', { maxAge: 3000, httpOnly: true });
            res.redirect('/');
        });
    } else {
        req.flash('error', 'No active session.');
        res.redirect('/users/login');
    }
};