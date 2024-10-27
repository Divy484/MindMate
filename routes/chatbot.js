const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const wrapAsync = require('../utils/wrapAsync');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// Initialize conversation history
let conversationHistory = [];

router.route("/")
.get((req, res) => {
    if (!req.user) {
        req.flash("error", "You must be logged in to MindMate!");
        return res.redirect("/login");
    }
    res.render("mood-test.ejs");
})
.post(wrapAsync(async (req, res) => {
    const userMessage = req.body.message;

    // Append user's message to the conversation history
    conversationHistory.push({ role: 'user', content: userMessage });

    // Create a single prompt with the full conversation history
    const promptWithHistory = conversationHistory.map((msg) => {
        return `${msg.role === 'user' ? 'You' : 'AI'}: ${msg.content}`;
    }).join('\n') + '\nAI:';

    try {
        const result = await model.generateContent(promptWithHistory);
        const aiResponse = result.response.text();

        // Append AI's response to the conversation history
        conversationHistory.push({ role: 'ai', content: aiResponse });

        res.json({ response: aiResponse });
    } catch (e) {
        console.log(e);
        res.status(500).json({ response: 'Sorry, something went wrong with the AI response.' });
    }
}));

router.post("/clear", (req, res) => {
    conversationHistory = [];
    res.sendStatus(200); 
});

module.exports = router;