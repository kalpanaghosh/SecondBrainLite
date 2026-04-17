const cron = require('node-cron');
const Event = require('../models/Event');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendWhatsAppMessage } = require('./whatsapp');

// Runs every minute
const startCronJobs = () => {
    cron.schedule('* * * * *', async () => {
        try {
            const now = new Date();
            // Get all events that have not been fully notified
            const events = await Event.find({
                $or: [
                    { notified1Hour: false },
                    { notified30Min: false }
                ]
            }).populate('user', 'username phone');

            for (let event of events) {
                // Parse event date and time
                // Format: date usually "YYYY-MM-DD", time "HH:MM"
                const [year, month, day] = event.date.split('-').map(Number);
                const [hour, minute] = event.time.split(':').map(Number);
                
                // Construct Date object in local time (or assuming server time)
                const eventTime = new Date(year, month - 1, day, hour, minute);
                
                const timeDiffMs = eventTime - now;
                const timeDiffMin = Math.floor(timeDiffMs / (1000 * 60));

                if (timeDiffMin > 0 && timeDiffMin <= 60 && !event.notified1Hour) {
                    // Send 1 Hour Notification
                    const notif = new Notification({
                        sender: event.user._id,
                        recipient: event.user._id,
                        title: 'Upcoming Event (1 Hour)',
                        message: `Your event "${event.title}" is starting in approximately 1 hour at ${event.time}.`,
                        type: 'event'
                    });
                    await notif.save();

                    if (event.user.phone) {
                        await sendWhatsAppMessage(event.user.phone, `Reminder: Your event "${event.title}" starts in 1 hour.`);
                    }

                    event.notified1Hour = true;
                    await event.save();
                } else if (timeDiffMin > 0 && timeDiffMin <= 30 && event.notified1Hour && !event.notified30Min) {
                    // Send 30 Min Notification
                    const notif = new Notification({
                        sender: event.user._id,
                        recipient: event.user._id,
                        title: 'Upcoming Event (30 Mins)',
                        message: `Your event "${event.title}" is starting in 30 minutes!`,
                        type: 'event'
                    });
                    await notif.save();

                    if (event.user.phone) {
                        await sendWhatsAppMessage(event.user.phone, `Urgent Reminder: Your event "${event.title}" starts in 30 mins.`);
                    }

                    event.notified30Min = true;
                    await event.save();
                } else if (timeDiffMin <= 0 && (!event.notified1Hour || !event.notified30Min)) {
                    // If it passed and wasn't notified, just mark as notified so we don't spam
                    event.notified1Hour = true;
                    event.notified30Min = true;
                    await event.save();
                }
            }
        } catch (err) {
            console.error('Error in cron job:', err);
        }
    });
    console.log('Cron jobs started: Watching for upcoming events...');
};

module.exports = { startCronJobs };
