const express = require('express');
const Appointment = require("../models/appointment.js");
const { isDoctor } = require("../utils/middleware.js");
const User = require("../models/user.js");
const Message = require("../models/message.js");
const mongoose = require("mongoose");
const router = express.Router();

router.get('/dashboard', isDoctor, async (req, res) => {
    try {
        const doctorName = req.user.username; // Assuming username is used to identify doctors

        // Total appointments for the doctor
        const totalAppointments = await Appointment.countDocuments({ therapist: doctorName });

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);
        
        // Today's appointments for the doctor
        const todaysAppointments = await Appointment.find({
            therapist: doctorName,
            date: { $gte: today, $lt: tomorrow }
        });
        
        // Upcoming appointments for the doctor
        const upcomingAppointments = await Appointment.find({
            therapist: doctorName,
            date: { $gt: tomorrow }
        }).countDocuments();
        
        // Completed appointments for the doctor
        const completedAppointments = await Appointment.find({
            therapist: doctorName,
            isCompleted: true,
            date: { $lt: today }
        }).countDocuments();
        
        res.render('therapist/dashboard', {
            doctorName,
            totalAppointments,
            completedAppointments,
            upcomingAppointments,
            todaysAppointments
        });
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).send('Error loading dashboard');
    }
});

router.patch('/:id/toggle-completion', async (req, res) => {
    try {
        const appointmentId = req.params.id;

        // Find the appointment and update its isCompleted status
        const updatedAppointment = await Appointment.findByIdAndUpdate(
            appointmentId,
            { isCompleted: true }
        );

        if (!updatedAppointment) {
            return res.status(404).send('Appointment not found');
        }
        
        res.json(updatedAppointment);
    } catch (error) {
        console.error('Error updating appointment:', error);
        res.status(500).send('Error updating appointment');
    }
});

// Route to display all chats for the doctor
router.get("/chat", async (req, res) => {
    if(!req.user){
        req.flash("error", "You must be logged in to MindMate!");
        return res.redirect("/login");
    }
    const doctorId = req.user._id;
    const doctorObjectId = new mongoose.Types.ObjectId(doctorId);

    // Find users that the doctor has chatted with
    const users = await Message.aggregate([
        { $match: { receiver: doctorObjectId } },
        { $group: { _id: "$sender", lastMessage: { $last: "$message" } } },
        { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "userInfo" } },
        { $unwind: "$userInfo" },
        { $project: { lastMessage: 1, "userInfo.username": 1 } }
    ]);

    res.render("doctor-chats", { users });
});

// Route to view chat with a specific user
router.get("/chat/:userId", async (req, res) => {
    if(!req.user){
        req.flash("error", "You must be logged in to MindMate!");
        return res.redirect("/login");
    }
    const userId = req.params.userId;
    const doctorId = req.user._id;

    const user = await User.findById(userId, "username");

    const messages = await Message.find({
        $or: [
            { sender: userId, receiver: doctorId },
            { sender: doctorId, receiver: userId }
        ]
    }).sort({ date: 1 });

    res.render("doctor-chat-room", { messages, userId, doctorId, username: user.username });
});

// Route to send a message to the user
router.post("/chat/:userId", async (req, res) => {
    if(!req.user){
        req.flash("error", "You must be logged in to MindMate!");
        return res.redirect("/login");
    }
    const { message } = req.body;
    const userId = req.params.userId;
    const doctorId = req.user._id;

    const newMessage = new Message({
        sender: doctorId,
        receiver: userId,
        message
    });

    await newMessage.save();
    res.redirect(`/doctor/chat/${userId}`);
});

module.exports = router;