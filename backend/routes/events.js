const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Event = require('../models/Event');
const Notification = require('../models/Notification');

// Get all events for user
router.get('/', auth, async (req, res) => {
    try {
        const events = await Event.find({ user: req.user.id }).sort({ date: 1, time: 1 });
        res.json(events);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Create event
router.post('/', auth, async (req, res) => {
    const { title, date, time, description, location } = req.body;
    try {
        const newEvent = new Event({
            user: req.user.id,
            title,
            date,
            time,
            description: description || '',
            location: location || ''
        });
        const event = await newEvent.save();

        const notif = new Notification({
            sender: req.user.id,
            recipient: req.user.id,
            title: 'Event Created',
            message: `Your event "${title}" on ${date} has been scheduled.`,
            type: 'event'
        });
        await notif.save();

        res.json(event);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Update event
router.put('/:id', auth, async (req, res) => {
    const { title, date, time, description, location, notified1Hour, notified30Min } = req.body;
    try {
        let event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ msg: 'Event not found' });
        if (event.user.toString() !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });

        const updateFields = {};
        if (title) updateFields.title = title;
        if (date) updateFields.date = date;
        if (time) updateFields.time = time;
        if (description !== undefined) updateFields.description = description;
        if (location !== undefined) updateFields.location = location;
        if (notified1Hour !== undefined) updateFields.notified1Hour = notified1Hour;
        if (notified30Min !== undefined) updateFields.notified30Min = notified30Min;

        // If date/time changed, reset notification flags if they aren't explicitly passed
        if ((date && date !== event.date) || (time && time !== event.time)) {
             if(notified1Hour === undefined) updateFields.notified1Hour = false;
             if(notified30Min === undefined) updateFields.notified30Min = false;
        }

        event = await Event.findByIdAndUpdate(
            req.params.id,
            { $set: updateFields },
            { new: true }
        );

        const notif = new Notification({
            sender: req.user.id,
            recipient: req.user.id,
            title: 'Event Updated',
            message: `Your event "${event.title}" has been updated.`,
            type: 'event'
        });
        await notif.save();

        res.json(event);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Delete event
router.delete('/:id', auth, async (req, res) => {
    try {
        let event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ msg: 'Event not found' });
        if (event.user.toString() !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });

        await Event.findByIdAndDelete(req.params.id);

        const notif = new Notification({
            sender: req.user.id,
            recipient: req.user.id,
            title: 'Event Removed',
            message: `Your event "${event.title}" has been canceled.`,
            type: 'warning'
        });
        await notif.save();

        res.json({ msg: 'Event removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
