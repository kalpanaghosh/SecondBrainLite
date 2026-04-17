const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Notification = require('../models/Notification');
const User = require('../models/User');

// Get all notifications for the current user (personal + broadcasts)
router.get('/', auth, async (req, res) => {
    try {
        const notifications = await Notification.find({
            $or: [
                { recipient: req.user.id },
                { isBroadcast: true }
            ]
        })
        .populate('sender', 'username')
        .sort({ createdAt: -1 })
        .limit(50);

        // Add a 'read' flag for the current user
        const enriched = notifications.map(n => ({
            ...n.toObject(),
            read: n.readBy.some(id => id.toString() === req.user.id)
        }));

        res.json(enriched);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Get unread count
router.get('/unread-count', auth, async (req, res) => {
    try {
        const notifications = await Notification.find({
            $or: [
                { recipient: req.user.id },
                { isBroadcast: true }
            ],
            readBy: { $ne: req.user.id }
        });
        res.json({ count: notifications.length });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Send notification to a specific user
router.post('/send', auth, async (req, res) => {
    const { recipientUsername, title, message, type } = req.body;
    try {
        const recipient = await User.findOne({ username: recipientUsername });
        if (!recipient) return res.status(404).json({ msg: 'User not found' });

        const notification = new Notification({
            sender: req.user.id,
            recipient: recipient._id,
            title,
            message,
            type: type || 'info',
            isBroadcast: false
        });

        await notification.save();
        const populated = await notification.populate('sender', 'username');
        res.json({ ...populated.toObject(), read: false });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Broadcast notification to all users
router.post('/broadcast', auth, async (req, res) => {
    const { title, message, type } = req.body;
    try {
        const notification = new Notification({
            sender: req.user.id,
            recipient: null,
            title,
            message,
            type: type || 'info',
            isBroadcast: true
        });

        await notification.save();
        const populated = await notification.populate('sender', 'username');
        res.json({ ...populated.toObject(), read: false });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Mark notification as read
router.put('/:id/read', auth, async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        if (!notification) return res.status(404).json({ msg: 'Notification not found' });

        if (!notification.readBy.includes(req.user.id)) {
            notification.readBy.push(req.user.id);
            await notification.save();
        }

        res.json({ msg: 'Marked as read' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Mark all notifications as read
router.put('/mark-all-read', auth, async (req, res) => {
    try {
        await Notification.updateMany(
            {
                $or: [
                    { recipient: req.user.id },
                    { isBroadcast: true }
                ],
                readBy: { $ne: req.user.id }
            },
            { $push: { readBy: req.user.id } }
        );
        res.json({ msg: 'All notifications marked as read' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Delete a notification (only sender can delete)
router.delete('/:id', auth, async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        if (!notification) return res.status(404).json({ msg: 'Notification not found' });
        if (notification.sender.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }
        await Notification.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Notification removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Get all users (for recipient selection)
router.get('/users', auth, async (req, res) => {
    try {
        const users = await User.find().select('username _id');
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
