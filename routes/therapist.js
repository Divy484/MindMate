const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const Appointment = require("../models/appointment.js");

function isLoggedIn (req, res, next) {
    req.user ? next() : res.sendStatus(401);
}

router.get("/", (req, res) => {
    if(!req.user){
        req.flash("error", "You must be logged in to MindMate!");
        return res.redirect("/login");
    }
    res.render("therapist/therapist.ejs");
});

router.route("/connect")
.get((req, res) => {
    if(req.user){
        if (!req.isAuthenticated()) {
            req.flash("error", "You must be logged in to MindMate!");
            return res.redirect("/login");
        } else {
            let email = req.user.email;
            let therapist = req.query.therapist;
            res.render("therapist/connect-form.ejs", { email, therapist });
        }
    } else {
        req.flash("error", "You must be logged in to MindMate!");
        return res.redirect("/login");
    }
})
.post(wrapAsync(async(req, res) => {
    try{

        let { name, email, phone, therapist, date, message } = req.body;
        const newAppointment = new Appointment({ name, email, phone, therapist, date, message });
        await newAppointment.save();
        req.flash("success", "Appointment booked successfully!");
        res.redirect("/appointment");

    } catch(err) {
        req.flash("error", err.message);
        res.redirect("/appointment/connect");
    }
}));

module.exports = router;