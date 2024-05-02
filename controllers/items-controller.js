const multer = require('multer');
const itemModel = require('../models/itemModel');
const UserModel = require('../models/userModel');
const OfferModel = require('../models/offerModel');
const mongoose = require('mongoose'); // Ensure mongoose is available for transaction support

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, './public/uploads/'),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});

const upload = multer({ storage: storage });

exports.getAllItems = async (req, res) => {
    try {
        const query = { active: true };
        if (req.query.query) {
            const searchQuery = req.query.query.toLowerCase();
            query.$or = [{ title: { $regex: searchQuery, $options: 'i' } }, { details: { $regex: searchQuery, $options: 'i' } }];
        }
        const items = await itemModel.find(query).sort({ price: 1 });
        res.render('items', { items });
    } catch (err) {
        console.error('Error fetching items:', err);
        res.status(500).render('error', { error: err.message });
    }
};

exports.getNewItemForm = (req, res) => {
    if (!req.session.user) {
        req.flash('error', 'You must be logged in to list an item.');
        return res.redirect('/users/login');
    }
    res.render('new');
};

exports.addItem = async (req, res) => {
    if (!req.session.user) {
        req.flash('error', 'You must be logged in to list an item.');
        return res.redirect('/users/login');
    }
    try {
        const newItem = await itemModel.create({
            title: req.body.title,
            price: req.body.price,
            condition: req.body.condition,
            details: req.body.details,
            seller: req.session.user._id,
            image: req.file ? '/uploads/' + req.file.filename : '',
            offers: 0,
            active: true
        });
        await UserModel.findByIdAndUpdate(req.session.user._id, { $push: { items: newItem._id } });
        req.flash('success', 'Item successfully listed.');
        res.redirect('/items');
    } catch (err) {
        console.error('Error adding new item:', err);
        req.flash('error', 'Failed to list the item due to an error.');
        res.status(500).redirect('/items/new');
    }
};

exports.getItemById = async (req, res) => {
    try {
        const item = await itemModel.findById(req.params.id).populate('seller');
        if (!item) {
            req.flash('error', 'Item not found.');
            return res.status(404).redirect('/items');
        }
        res.render('item', { item });
    } catch (err) {
        console.error('Error retrieving item:', err);
        req.flash('error', 'Failed to retrieve item due to an error.');
        res.status(500).redirect('/items');
    }
};

exports.getEditItemForm = async (req, res) => {
    try {
        const item = await itemModel.findById(req.params.id);
        if (!item) {
            req.flash('error', 'Item not found.');
            return res.status(404).redirect('/items');
        }
        if (item.seller.toString() !== req.session.user._id.toString()) {
            req.flash('error', 'Unauthorized to edit this item.');
            return res.status(401).redirect('/items');
        }
        res.render('edit', { item });
    } catch (err) {
        console.error('Error fetching item for edit:', err);
        req.flash('error', 'Failed to fetch item for editing due to an error.');
        res.status(500).redirect('/items');
    }
};

exports.editItem = async (req, res) => {
    try {
        const item = await itemModel.findOne({_id: req.params.id, seller: req.session.user._id});
        if (!item) {
            req.flash('error', 'Item not found or you do not have permission to edit it.');
            return res.status(404).redirect('/items');
        }
        
        const updatedData = {
            title: req.body.title,
            price: req.body.price,
            condition: req.body.condition,
            details: req.body.details,
        };
        await itemModel.findByIdAndUpdate(req.params.id, updatedData, { new: true });
        req.flash('success', 'Item successfully updated.');
        res.redirect(`/items/${item.id}`);
    } catch (err) {
        console.error('Error updating item:', err);
        req.flash('error', 'Failed to update item due to an error.');
        res.status(500).redirect(`/items/edit/${req.params.id}`);
    }
};

exports.deleteItem = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const itemId = req.params.id;
        const item = await itemModel.findOne({_id: itemId});
        if (!item) {
            throw new Error('Item not found');
        }
        if (item.seller.toString() !== req.session.user._id.toString()) {
            throw new Error('Unauthorized to delete this item');
        }
        await OfferModel.deleteMany({ item: itemId }, { session });
        await itemModel.deleteOne({_id: itemId}, { session });
        await session.commitTransaction();
        session.endSession();
        req.flash('success', 'Item and all associated offers successfully deleted.');
        res.redirect('/users/profile');
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        console.error('Failed to delete item:', err);
        req.flash('error', err.message);
        res.redirect('/users/profile');
    }
};

exports.upload = upload;