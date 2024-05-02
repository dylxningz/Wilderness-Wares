
function isLoggedIn(req, res, next) {
    if (!req.session.user) {
        req.flash('error', 'You need to log in to access this page.');
        return res.redirect('/users/login');
    }
    next();
}


function isGuest(req, res, next) {
    if (req.session.user) {
        req.flash('info', 'You are already logged in.');
        return res.redirect('/');
    }
    next();
}

function isAuthenticated(req, res, next) {
    if (!req.session.user) {
        req.flash('error', 'You must be logged in to view this page.');
        res.redirect('/users/login');
    } else {
        next();
    }
}

module.exports = {
    isLoggedIn,
    isGuest,
    isAuthenticated
};