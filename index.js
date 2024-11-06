if(process.env.NODE_ENV != "production"){
    require("dotenv").config();
}

const express = require("express");
const ejsMate = require("ejs-mate");
const path = require("path");
const app = express();
const mongoose = require("mongoose");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const session = require("express-session");
const axios = require("axios");

const ExpressError = require("./utils/ExpressError.js");
const User = require("./models/user.js");
const userRouter = require("./routes/user.js");
const therapistRouter = require("./routes/therapist.js");
const chatbotRouter = require("./routes/chatbot.js");
const dashboardRouter = require("./routes/dashboard.js");
require("./controllers/google.js");

const port = process.env.PORT;

const dbUrl = process.env.DB_URL;

main().then(() => {
    console.log("Database Connected!!");
})
.catch((err) => console.log(err));

async function main() {
    mongoose.connect(dbUrl); 
}

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.engine("ejs", ejsMate);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "/public")));

const sessionOptions = {
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 1 * 24 * 60 * 60 * 1000,
        maxAge: 1 * 24 * 60 * 60 * 1000,
        httpOnly: true
    }
};

app.use(session(sessionOptions));
app.use(flash());

//User authentication
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});

app.get("/", async (req, res) => {
    try {
        const newsapi = process.env.NEWSAPI;
        
        const response = await axios.get(`https://newsapi.org/v2/everything?q=mental-health&apiKey=${newsapi}`);
        let articles = response.data.articles;

        articles = articles.sort(() => 0.5 - Math.random()).slice(0, 9);
        
        if (req.user) {
            if (!req.isAuthenticated()) {
                req.flash("error", "You must be logged in to MindMate!");
                return res.redirect("/login");
            } else {
                let email = req.user.email;
                let user = await User.findOne({ email: email });
                let username = user.username;
                res.render("home.ejs", { username, articles });
            }
        } else {
            res.render("home.ejs", { articles });
        }
    } catch (error) {
        console.error("Error fetching articles: ", error);
        req.flash("error", "Unable to fetch live news at the moment.");
        res.render("home.ejs", { articles: [] });
    }
});

app.use("/", userRouter);
app.use("/appointment", therapistRouter);
app.use("/chat", chatbotRouter);
app.use("/doctor", dashboardRouter);

app.get("/quotes", (req, res) => {
    res.render("explore-quotes.ejs");
});

app.get("/exercise", (req, res) => {
    res.render("exercise.ejs");
});

//Custom Error Handler
app.all("*", (req, res, next) => {
    next(new ExpressError(404, "Page Not Found!"));
});

app.use((err, req, res, next) => {
    let {statusCode=500, message="Something went wrong!!"} = err;
    res.status(statusCode).render("error.ejs", { message });
});

app.listen(port, () => {
    console.log(`server listening on port ${port}`);
});