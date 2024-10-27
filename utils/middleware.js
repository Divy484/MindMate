function isDoctor(req, res, next) {
    if (req.isAuthenticated() && req.user.role === "doctor") {
        return next();
    }
    req.flash("error", "You do not have permission to access this page.");
    res.redirect("/login");
}

module.exports = { isDoctor };