const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Note = require('../models/Note');
const Notification = require('../models/Notification');

// Get all notes for user
router.get('/', auth, async (req, res) => {
    try {
        const notes = await Note.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json(notes);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Create note
router.post('/', auth, async (req, res) => {
    const { title, content, tags } = req.body;
    try {
        const newNote = new Note({
            user: req.user.id,
            title,
            content,
            tags: tags || []
        });
        const note = await newNote.save();

        const notif = new Notification({
            sender: req.user.id,
            recipient: req.user.id,
            title: 'Note Created',
            message: `Your note "${title}" has been created.`,
            type: 'success'
        });
        await notif.save();

        res.json(note);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Update note
router.put('/:id', auth, async (req, res) => {
    const { title, content, tags } = req.body;
    try {
        let note = await Note.findById(req.params.id);
        if (!note) return res.status(404).json({ msg: 'Note not found' });
        if (note.user.toString() !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });

        note = await Note.findByIdAndUpdate(
            req.params.id,
            { $set: { title, content, tags } },
            { new: true }
        );

        const notif = new Notification({
            sender: req.user.id,
            recipient: req.user.id,
            title: 'Note Updated',
            message: `Your note "${title}" has been updated.`,
            type: 'info'
        });
        await notif.save();

        res.json(note);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Delete note
router.delete('/:id', auth, async (req, res) => {
    try {
        let note = await Note.findById(req.params.id);
        if (!note) return res.status(404).json({ msg: 'Note not found' });
        if (note.user.toString() !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });

        await Note.findByIdAndDelete(req.params.id);

        const notif = new Notification({
            sender: req.user.id,
            recipient: req.user.id,
            title: 'Note Deleted',
            message: `Your note "${note.title}" has been deleted.`,
            type: 'warning'
        });
        await notif.save();

        res.json({ msg: 'Note removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
