const OfferModel = require('../models/offerModel');
const ItemModel = require('../models/itemModel');

exports.makeOffer = async (req, res) => {
    const { itemId, offerAmount } = req.body;
    if (!req.session.user) {
        req.flash('error', 'You need to log in to make an offer.');
        return res.redirect('/login');
    }

    try {
        const item = await ItemModel.findById(itemId);
        if (!item) {
            req.flash('error', 'Item not found.');
            return res.status(404).redirect('/items');
        }

        if (item.seller.equals(req.session.user._id)) {
            req.flash('error', 'You cannot make an offer on your own item.');
            return res.status(401).redirect(`/items/${itemId}`);
        }

        const offer = new OfferModel({
            item: itemId,
            user: req.session.user._id,
            amount: offerAmount
        });

        await offer.save();
        item.totalOffers++;
        item.highestOffer = Math.max(item.highestOffer, offerAmount);
        await item.save();

        req.flash('success', 'Offer made successfully.');
        res.redirect(`/items/${itemId}`);
    } catch (error) {
        console.error('Error during making an offer:', error);
        req.flash('error', 'Server error while making an offer.');
        res.status(500).redirect('/items');
    }
};

exports.viewOffers = async (req, res) => {
    const { itemId } = req.params;

    try {
        const item = await ItemModel.findById(itemId);
        if (!item) {
            req.flash('error', 'Item not found.');
            return res.status(404).redirect('/items');
        }

        const offers = await OfferModel.find({ item: itemId }).populate('user');
        if (!offers.length) {
            req.flash('info', 'There are no offers on this item yet.');
            return res.render('offer/offers', { item, offers, noOffersMessage: 'No offers yet.' });
        }

        res.render('offer/offers', { item, offers });
    } catch (error) {
        console.error('Error fetching offers:', error);
        req.flash('error', 'Server error while fetching offers.');
        res.status(500).redirect('/items');
    }
};

exports.acceptOffer = async (req, res) => {
    const { offerId } = req.params;

    try {
        const offer = await OfferModel.findById(offerId).populate('item');
        if (!offer) {
            req.flash('error', 'Offer not found.');
            return res.status(404).redirect('/items');
        }

        if (req.session.user._id !== offer.item.seller.toString()) {
            req.flash('error', 'Unauthorized: You cannot accept this offer.');
            return res.status(401).redirect(`/items/${offer.item._id}/offers`);
        }

        offer.status = 'accepted';
        await offer.save();
        
        const item = offer.item;
        item.active = false;
        await item.save();

        const offers = await OfferModel.find({ item: item._id, _id: { $ne: offerId } });
        for (let otherOffer of offers) {
            otherOffer.status = 'rejected';
            await otherOffer.save();
        }

        req.flash('success', 'Offer accepted successfully.');
        res.redirect(`/items/${item._id}/offers`);
    } catch (error) {
        console.error('Error accepting offer:', error);
        req.flash('error', 'Server error while accepting the offer.');
        res.status(500).redirect(`/items/${offerId}/offers`);
    }
};