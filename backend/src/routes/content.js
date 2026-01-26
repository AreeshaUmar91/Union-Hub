import express from "express";
import { requireAuth } from "../auth.js";
import { sendBroadcastEmail } from "../services/email.js";

const allowedTypes = new Set([
  "meetings",
  "votes",
  "news",
  "employees",
  "officials",
  "contracts",
  "benefits",
  "faqs",
  "notifications",
]);

function normalizeType(type) {
  const value = String(type || "").toLowerCase();
  return allowedTypes.has(value) ? value : null;
}

export function createContentRouter({ db, jwtSecret }) {
  const router = express.Router();
  router.use(requireAuth({ jwtSecret }));

  const notificationTypes = {
    meetings: "Meeting",
    votes: "Vote",
    news: "News",
    benefits: "Benefit",
    faqs: "FAQ",
    employees: "Employee",
    officials: "Official",
    contracts: "Contract",
    notifications: "Notification Settings",
  };

  async function notifyDirectors(action, type, itemData, user) {
    if (!["principal", "vice_principal"].includes(user.role)) return;

    try {
      const emails = await db.getDirectorEmails();
      if (!emails || emails.length === 0) return;

      const readableType = notificationTypes[type] || type;
      const contentTitle = itemData.title || itemData.pollName || itemData.name || itemData.kind || "Item";

      const subject = `Director Alert: ${readableType} ${action}`;
      const htmlContent = `
          <div style="font-family: Arial, sans-serif;">
              <p>Hello Director,</p>
              <p>The following action was performed by <strong>${user.name || user.email}</strong> (${user.role}):</p>
              <ul>
                  <li><strong>Action:</strong> ${action}</li>
                  <li><strong>Type:</strong> ${readableType}</li>
                  <li><strong>Title:</strong> ${contentTitle}</li>
                  <li><strong>Time:</strong> ${new Date().toLocaleString()}</li>
              </ul>
              <p>Please log in to Union Hub to review.</p>
          </div>
      `;

      await sendBroadcastEmail(emails, subject, htmlContent);
      console.log(`Director notification sent for ${action} ${type}`);
    } catch (err) {
      console.error("Failed to notify directors:", err);
    }
  }

  function canManageType(type, role) {
    if (["meetings", "votes", "news", "benefits", "faqs", "notifications"].includes(type)) {
      return role === "director" || role === "principal" || role === "vice_principal";
    }
    if (type === "employees") {
      return role === "director" || role === "principal" || role === "vice_principal";
    }
    return role === "director";
  }

  router.get("/:type", async (req, res) => {
    const type = normalizeType(req.params.type);
    if (!type) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const items = await db.listContentByType(type);
    if (type === "notifications") {
      const role = req.user?.role;
      const email = req.user?.email;
      const filtered = items.filter((item) => {
        const data = item?.data || {};
        if (data.broadcast === true) return true;

        const recipientsEmails = Array.isArray(data.recipientsEmails) ? data.recipientsEmails : null;
        if (recipientsEmails && recipientsEmails.length > 0) {
          return Boolean(email) && recipientsEmails.includes(email);
        }

        const recipientsRoles = Array.isArray(data.recipientsRoles) ? data.recipientsRoles : null;
        if (recipientsRoles && recipientsRoles.length > 0) {
          return Boolean(role) && recipientsRoles.includes(role);
        }

        return true;
      });
      res.json({ items: filtered });
      return;
    }
    res.json({ items });
  });

  router.get("/:type/:id", async (req, res) => {
    const type = normalizeType(req.params.type);
    if (!type) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const item = await db.getContentById(type, id);
    if (!item) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json({ item });
  });

  router.post("/:type", async (req, res) => {
    const type = normalizeType(req.params.type);
    if (!type) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    if (!canManageType(type, req.user?.role)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const item = await db.createContent({ type, data: req.body, created_by: req.user.id });

    // Notify Directors if action done by Principal/Vice Principal
    await notifyDirectors("Created", type, req.body, req.user);

    // Send broadcast notification for specific types
    if (["meetings", "votes", "news", "benefits", "faqs"].includes(type)) {
      // Run in background
      (async () => {
        try {
          const emails = await db.getAllUserEmails();
          if (emails && emails.length > 0) {
            const contentTitle = req.body.title || req.body.pollName || req.body.name || "New Content";
            const readableType = notificationTypes[type];
            const subject = `New ${readableType} added: ${contentTitle}`;
            const htmlContent = `
              <div style="font-family: Arial, sans-serif;">
                <p>Hello,</p>
                <p>A new <strong>${readableType}</strong> has been added to Union Hub.</p>
                <h3 style="color: #007bff;">${contentTitle}</h3>
                <p>Please log in to the application to view more details.</p>
                <br/>
                <p>Best regards,</p>
                <p>Union Hub Team</p>
              </div>
            `;
            await sendBroadcastEmail(emails, subject, htmlContent);
          }
        } catch (err) {
          console.error(`Failed to send broadcast email for ${type}:`, err);
        }
      })();
    }

    res.status(201).json({ item });
  });

  router.put("/:type/:id", async (req, res) => {
    const type = normalizeType(req.params.type);
    if (!type) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    if (!canManageType(type, req.user?.role)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const item = await db.updateContent({ type, id, data: req.body });
    if (!item) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    // Notify Directors
    await notifyDirectors("Updated", type, item.data, req.user);

    res.json({ item });
  });

  router.delete("/:type/:id", async (req, res) => {
    const type = normalizeType(req.params.type);
    if (!type) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    if (!canManageType(type, req.user?.role)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }

    // Fetch item before deletion for notification
    const existing = await db.getContentById(type, id);

    const ok = await db.deleteContent({ type, id });
    if (!ok) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    if (existing) {
      await notifyDirectors("Deleted", type, existing.data, req.user);
    }

    res.status(204).end();
  });

  return router;
}
