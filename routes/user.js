const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const User = require("../models/user.js");
const Message = require("../models/message.js");
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
            req.flash("success", `Welcome to MindMate, ${username}!`);
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
.post((req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
        if (err) return next(err);
        if (!user) {
            req.flash("error", "Invalid username or password");
            return res.redirect("/login");
        }
        req.login(user, (err) => {
            if (err) return next(err);

            // Redirect based on role
            const redirectUrl = user.role === "doctor" ? "/doctor/dashboard" : "/";
            req.flash("success", `Welcome back, ${user.role === "doctor" ? user.username : user.username}!`);
            res.redirect(redirectUrl);
        });
    })(req, res, next);
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
            req.flash("success", `Welcome to MindMate, ${username}!`);
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
            req.flash("success", `Welcome to MindMate, ${username}!`);
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

// Route to display chat options for the user
router.get("/chat", async (req, res) => {
    if(!req.user){
        req.flash("error", "You must be logged in to MindMate!");
        return res.redirect("/login");
    }
    const doctors = await User.find({ role: "doctor" });
    res.render("doctor-list", { doctors });
});

// Route to initiate a chat with a doctor
router.get("/chat/:doctorId", async (req, res) => {
    if(!req.user){
        req.flash("error", "You must be logged in to MindMate!");
        return res.redirect("/login");
    }
    const doctorId = req.params.doctorId;
    const username = req.user.displayName || req.user.username;
    
    const user = await User.findOne({ username: username }); 
    const userId = user._id;
    const doctor = await User.findById(doctorId);
    const doctorName = doctor.username;

    // Fetch previous messages between the user and doctor if they exist
    const messages = await Message.find({
        $or: [
            { sender: userId, receiver: doctorId },
            { sender: doctorId, receiver: userId }
        ]
    }).sort({ date: 1 });

    res.render("chat-room", { messages, doctorId, userId, doctorName });
});

// Route to send a message from the user to the doctor
router.post("/chat/:doctorId", async (req, res) => {
    if(!req.user){
        req.flash("error", "You must be logged in to MindMate!");
        return res.redirect("/login");
    }
    const { message } = req.body;
    const username = req.user.displayName || req.user.username;
    
    const userId = await User.findOne({ username: username });
    const doctorId = req.params.doctorId;

    const newMessage = new Message({
        sender: userId._id,
        receiver: doctorId,
        message
    });

    await newMessage.save();
    res.redirect(`/chat/${doctorId}`);
});

module.exports = router;