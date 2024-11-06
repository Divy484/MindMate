const express = require('express');
const Appointment = require("../models/appointment.js");
const { isDoctor } = require("../utils/middleware.js");
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

module.exports = router;