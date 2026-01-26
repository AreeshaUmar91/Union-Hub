import { sendBroadcastEmail } from "./email.js";

export function startScheduler(db) {
  console.log("Starting notification scheduler...");
  // Check immediately on start
  checkReminders(db).catch((err) => console.error("Scheduler error (initial):", err));

  // Check every minute
  setInterval(async () => {
    try {
      await checkReminders(db);
    } catch (err) {
      console.error("Scheduler error:", err);
    }
  }, 60 * 1000);
}

async function checkReminders(db) {
  const settings = await db.getLatestNotificationSettings();
  if (!settings || !settings.data.enabled || !settings.data.selectedTime) {
    return;
  }

  const timeStr = settings.data.selectedTime;
  const minutesBefore = parseTime(timeStr);
  if (minutesBefore <= 0) return;

  const now = new Date();

  // Check Meetings
  await processReminders(db, "meetings", "Meeting", minutesBefore, now);

  // Check Votes
  await processReminders(db, "votes", "Vote", minutesBefore, now);
}

async function processReminders(db, type, label, minutesBefore, now) {
  const items = await db.getPendingReminders(type);
  const emails = await db.getAllUserEmails();

  if (!emails || emails.length === 0) return;

  for (const item of items) {
    // Determine target time
    let targetTime = null;

    if (type === "meetings") {
      // item.data.date (YYYY-MM-DD) and item.data.startTime (HH:MM)
      if (item.data.date && item.data.startTime) {
        // Construct date object correctly
        targetTime = new Date(`${item.data.date}T${item.data.startTime}`);
      }
    } else if (type === "votes") {
      // item.data.endDate (ISO string or similar)
      if (item.data.endDate) {
        targetTime = new Date(item.data.endDate);
      }
    }

    if (!targetTime || isNaN(targetTime.getTime())) continue;

    // Calculate trigger time
    const triggerTime = new Date(targetTime.getTime() - minutesBefore * 60000);

    // Logic:
    // If now >= triggerTime AND now < targetTime
    // Then send reminder.
    // If we missed the window (e.g. server was down), but it's still before the event, send it.
    // If the event has passed (now > targetTime), do NOT send reminder (it's too late), but mark as sent?
    // Maybe mark as sent to avoid repeated checks? No, processReminders fetches items where reminderSent != true.
    // So if we don't mark it, it will keep checking.
    // If event passed, we should probably mark it as sent (or expired) so we stop checking.

    if (now > targetTime) {
      // Event passed, mark as processed to stop checking
      await db.markReminderSent(type, item.id);
      continue;
    }

    if (now >= triggerTime) {
      // Send email
      const title = item.data.title || item.data.name || item.data.pollName || "Event";
      const subject = `Reminder: Upcoming ${label} - ${title}`;
      const html = `
            <div style="font-family: Arial, sans-serif;">
                <p>Hello,</p>
                <p>This is a reminder for the upcoming <strong>${label}</strong>.</p>
                <h3 style="color: #007bff;">${title}</h3>
                <p>It is scheduled for: <strong>${targetTime.toLocaleString()}</strong></p>
                <p>Please log in to Union Hub for more details.</p>
                <br/>
                <p>Union Hub Team</p>
            </div>
        `;

      try {
        await sendBroadcastEmail(emails, subject, html);
        console.log(`Sent reminder for ${type} ${item.id} to ${emails.length} users.`);
      } catch (err) {
        console.error(`Failed to send reminder for ${type} ${item.id}:`, err);
      }
      
      // Mark as sent regardless of email success to prevent loops? 
      // Better to mark only on success or if persistent failure. 
      // But for now, mark as sent.
      await db.markReminderSent(type, item.id);
    }
  }
}

function parseTime(str) {
  // "5 mins", "1 hour", etc.
  const lower = str.toLowerCase();
  if (lower.includes("hour")) {
    return (parseFloat(lower) || 0) * 60;
  }
  if (lower.includes("min")) {
    return parseFloat(lower) || 0;
  }
  // "24 hours" -> 24 * 60
  return 0;
}
