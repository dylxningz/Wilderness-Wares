const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const itemsController = require('../controllers/items-controller');
const { isLoggedIn } = require('../middleware/auth');
const upload = itemsController.upload;

// Offers routes
const offersRoute = require('./offers-route');
router.use('/:itemId/offers', offersRoute);

// Item-related routes
router.get('/new', isLoggedIn, itemsController.getNewItemForm);
router.get('/:id', itemsController.getItemById);
router.get('/', itemsController.getAllItems);

// Validation and sanitization rules for items
const validateAndSanitizeItem = [
    body('title').trim().notEmpty().withMessage('Title is required.'),
    body('price').trim().isFloat({ min: 1 }).withMessage('Price must be a number greater than 0.'),
    body('condition').trim().isIn(['new', 'used', 'mint', 'good', 'fair']).withMessage('Invalid condition specified.'),
    body('details').trim().escape()
];

// Routes for managing items
router.post('/add', isLoggedIn, upload.single('image'), validateAndSanitizeItem, (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash('error', errors.array().map(err => err.msg).join(', '));
        return res.redirect('/items/new');
    }
    itemsController.addItem(req, res);
});
router.get('/edit/:id', isLoggedIn, itemsController.getEditItemForm);
router.post('/edit/:id', isLoggedIn, upload.single('image'), itemsController.editItem);
router.post('/delete/:id', isLoggedIn, itemsController.deleteItem);

module.exports = router;