const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const Document = require('../models/Document');

const uploadDir = path.join(__dirname, '../uploads');

// Get share details
router.get('/:shareId', async (req, res) => {
    try {
        const doc = await Document.findOne({ shareId: req.params.shareId });
        if (!doc) return res.status(404).json({ msg: 'Link not found or invalid.' });

        // Check if shared
        if (!doc.isShared) {
             return res.status(403).json({ msg: 'This link is no longer active.' });
        }

        // Check expiration
        if (doc.expiresAt && new Date() > new Date(doc.expiresAt)) {
             return res.status(403).json({ msg: 'This link has expired.' });
        }

        res.json({
            originalName: doc.originalName,
            size: doc.size,
            mimeType: doc.mimeType,
            requiresPassword: !!doc.password,
            expiresAt: doc.expiresAt
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Download public share
router.post('/:shareId/download', async (req, res) => {
    const { password } = req.body;
    try {
        const doc = await Document.findOne({ shareId: req.params.shareId });
        
        if (!doc) return res.status(404).json({ msg: 'Link not found or invalid.' });
        if (!doc.isShared) return res.status(403).json({ msg: 'This link is no longer active.' });
        if (doc.expiresAt && new Date() > new Date(doc.expiresAt)) {
             return res.status(403).json({ msg: 'This link has expired.' });
        }

        // Check password if protected
        if (doc.password) {
            if (!password) {
                 return res.status(401).json({ msg: 'Password is required to access this file.' });
            }
            const isMatch = await bcrypt.compare(password, doc.password);
            if (!isMatch) {
                 return res.status(401).json({ msg: 'Incorrect password.' });
            }
        }

        const filePath = path.join(uploadDir, doc.filename);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ msg: 'File missing from server.' });
        }

        res.download(filePath, doc.originalName);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
