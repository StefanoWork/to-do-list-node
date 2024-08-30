export const authenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    req.flash('error', 'Please login to view your profile');
    return res.redirect('/login');
};