const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const User = require("../models/user.js");
const passport = require("passport");

function isLoggedIn (req, res, next) {
    req.user ? next() : res.sendStatus(401);
}

router.route("/signup")
.get((req, res) => {
    res.render("users/signup.ejs");
})
.post(wrapAsync(async(req, res) => {
    try{
        let {username, email, first_name, last_name, age, password} = req.body;
        const newUser = new User({first_name, last_name, age, email, username});
        const registeredUser = await User.register(newUser, password);
        console.log(registeredUser);
        req.login(registeredUser, (err) => {
            if(err) {
                return next(err);
            }
            req.flash("success", "Welcome to MindMate!");
            res.redirect("/");
        });
    } catch(err) {
        req.flash("error", err.message);
        res.redirect("/signup");
    }
}));

router.route("/login")
.get((req, res) => {
    res.render("users/login.ejs");
})
.post(passport.authenticate("local", { failureRedirect: "/login", failureFlash: true }), async(req, res) => {
    req.flash("success", "Welcome back to MindMate!");
    res.redirect("/");
});

router.get("/logout", (req, res, next) => {
    req.logOut((err) => {
        if(err) {
            return next(err);
        }
        req.flash("success", "You are logged out!!");
        res.redirect("/");
    });
});

router.get("/auth/google", passport.authenticate("google", { scope: ["email", "profile"] }));

router.get("/auth/google/callback", passport.authenticate("google", { 
    successRedirect: "/auth/protected", 
    failureRedirect: "/auth/google/failure"
}));

router.get("/auth/protected", isLoggedIn, async (req, res) => {
    try {
        const email = req.user.email;
        const fname = req.user.given_name;
        const lname = req.user.family_name;
        const username = req.user.displayName;

        const existingUser = await User.findOne({email : email});
        if (existingUser) {
            req.flash("success", "Welcome back to MindMate!");
            res.redirect("/");
        }
        else {
            const user = new User({
                email: email,
                first_name: fname,
                last_name: lname,
                username: username
            });
            console.log(user);
            await user.save();
            req.flash("success", "Welcome to MindMate!");
            res.redirect("/");
        }
    } catch (err) {
        req.flash("error", err.message);
        res.redirect("/login");
    }
});

router.get("/auth/google/failure", (req, res) => {
    res.send("something went wrong!!");
});

module.exports = router;