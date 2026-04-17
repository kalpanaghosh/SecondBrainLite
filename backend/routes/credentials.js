const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Credential = require('../models/Credential');
const { encrypt, decrypt } = require('../utils/encryption');
const Notification = require('../models/Notification');

// Get all credentials for user (decrypted)
router.get('/', auth, async (req, res) => {
    try {
        const credentials = await Credential.find({ user: req.user.id }).sort({ createdAt: -1 });
        const decryptedCredentials = credentials.map(cred => {
            return {
                _id: cred._id,
                websiteName: cred.websiteName,
                url: cred.url,
                username: cred.username,
                password: decrypt(cred.password),
                createdAt: cred.createdAt,
                updatedAt: cred.updatedAt
            };
        });
        res.json(decryptedCredentials);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Create credential
router.post('/', auth, async (req, res) => {
    const { websiteName, url, username, password } = req.body;
    try {
        const newCredential = new Credential({
            user: req.user.id,
            websiteName,
            url,
            username,
            password: encrypt(password)
        });
        const cred = await newCredential.save();

        const notif = new Notification({
            sender: req.user.id,
            recipient: req.user.id,
            title: 'Credential Saved',
            message: `Your credentials for ${websiteName} have been safely stored.`,
            type: 'success'
        });
        await notif.save();

        res.json({
             _id: cred._id,
             websiteName: cred.websiteName,
             url: cred.url,
             username: cred.username,
             password: decrypt(cred.password),
             createdAt: cred.createdAt,
             updatedAt: cred.updatedAt
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Update credential
router.put('/:id', auth, async (req, res) => {
    const { websiteName, url, username, password } = req.body;
    try {
        let cred = await Credential.findById(req.params.id);
        if (!cred) return res.status(404).json({ msg: 'Credential not found' });
        if (cred.user.toString() !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });

        const updatedFields = { websiteName, url, username };
        if (password && password.trim() !== '') {
            updatedFields.password = encrypt(password);
        }

        cred = await Credential.findByIdAndUpdate(
            req.params.id,
            { $set: updatedFields },
            { new: true }
        );

        const notif = new Notification({
            sender: req.user.id,
            recipient: req.user.id,
            title: 'Credential Updated',
            message: `Your credentials for ${websiteName} have been updated.`,
            type: 'info'
        });
        await notif.save();

        res.json({
             _id: cred._id,
             websiteName: cred.websiteName,
             url: cred.url,
             username: cred.username,
             password: decrypt(cred.password),
             createdAt: cred.createdAt,
             updatedAt: cred.updatedAt
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Delete credential
router.delete('/:id', auth, async (req, res) => {
    try {
        let cred = await Credential.findById(req.params.id);
        if (!cred) return res.status(404).json({ msg: 'Credential not found' });
        if (cred.user.toString() !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });

        await Credential.findByIdAndDelete(req.params.id);

        const notif = new Notification({
            sender: req.user.id,
            recipient: req.user.id,
            title: 'Credential Deleted',
            message: `Your credentials for ${cred.websiteName} have been deleted.`,
            type: 'warning'
        });
        await notif.save();

        res.json({ msg: 'Credential removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
