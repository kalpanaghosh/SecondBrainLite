const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const auth = require('../middleware/auth');
const Document = require('../models/Document');
const Notification = require('../models/Notification');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = crypto.randomUUID();
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage, 
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});

// Upload document
router.post('/upload', auth, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ msg: 'No file uploaded' });
        }

        const { title, description, category, uploadDate } = req.body;
        
        if (!title || !description || !category) {
            // Delete the uploaded file if form data is incomplete
            if (req.file) {
                fs.unlinkSync(path.join(uploadDir, req.file.filename));
            }
            return res.status(400).json({ msg: 'Please provide all required fields' });
        }

        const newDoc = new Document({
            user: req.user.id,
            title,
            description,
            category,
            uploadDate: uploadDate ? new Date(uploadDate) : Date.now(),
            originalName: req.file.originalname,
            filename: req.file.filename,
            mimeType: req.file.mimetype,
            size: req.file.size,
            shareId: crypto.randomUUID(), // unique initially generated id
            isShared: false // private by default
        });

        const doc = await newDoc.save();

        // Optional notification
        const notif = new Notification({
            sender: req.user.id,
            recipient: req.user.id,
            title: 'File Uploaded',
            message: `Successfully securely stored ${doc.originalName}`,
            type: 'success'
        });
        await notif.save();

        res.status(201).json(doc);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error during upload' });
    }
});

// Get user documents
router.get('/', auth, async (req, res) => {
    try {
        const docs = await Document.find({ user: req.user.id }).sort({ createdAt: -1 });
        // Don't leak hashed passwords if any in normal fetch
        const sanitized = docs.map(d => {
            const docObj = d.toObject();
            delete docObj.password;
            delete docObj.filename; // avoid giving internal filename path
            return docObj;
        });
        res.json(sanitized);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Download authenticated document
router.get('/download/:id', auth, async (req, res) => {
    try {
        const doc = await Document.findById(req.params.id);
        if (!doc) return res.status(404).json({ msg: 'Document not found' });
        if (doc.user.toString() !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });

        const filePath = path.join(uploadDir, doc.filename);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ msg: 'File missing from server' });
        }

        res.download(filePath, doc.originalName);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Delete document
router.delete('/:id', auth, async (req, res) => {
    try {
        const doc = await Document.findById(req.params.id);
        if (!doc) return res.status(404).json({ msg: 'Document not found' });
        if (doc.user.toString() !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });

        const filePath = path.join(uploadDir, doc.filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        await Document.findByIdAndDelete(req.params.id);

        res.json({ msg: 'Document securely deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Configure share settings
router.put('/:id/share', auth, async (req, res) => {
    const { isShared, password, expiresAt } = req.body;
    try {
        let doc = await Document.findById(req.params.id);
        if (!doc) return res.status(404).json({ msg: 'Document not found' });
        if (doc.user.toString() !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });

        const updates = { isShared };
        
        if (password) {
            const salt = await bcrypt.genSalt(10);
            updates.password = await bcrypt.hash(password, salt);
        } else if (password === '') {
            updates.password = null; // Clear password if empty string given
        }

        if (expiresAt !== undefined) {
            updates.expiresAt = expiresAt ? new Date(expiresAt) : null;
        }

        doc = await Document.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true });
        
        const docObj = doc.toObject();
        delete docObj.password;
        delete docObj.filename;
        
        res.json(docObj);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
