const express = require('express');
const router = express.Router({ mergeParams: true }); // Ensure params from parent routers are accessible
const offersController = require('../controllers/offers-controller');
const { body, validationResult } = require('express-validator');
const { isLoggedIn } = require('../middleware/auth');

// Validate and sanitize offer amount input
const validateAndSanitizeOffer = [
    body('offerAmount')
        .trim()
        .isFloat({ min: 1 })
        .withMessage('Offer must be a number greater than 0.')
];

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash('error', errors.array().map(error => error.msg).join(', '));
        return res.redirect('back'); 
    }
    next();
};

// Routes
// View all offers for a specific item
router.get('/', isLoggedIn, offersController.viewOffers);

// Make an offer on an item
router.post('/makeoffer/:itemId', isLoggedIn, validateAndSanitizeOffer, handleValidationErrors, offersController.makeOffer);

// Accept an offer on an item
router.post('/acceptoffer/:offerId', isLoggedIn, offersController.acceptOffer);

module.exports = router;