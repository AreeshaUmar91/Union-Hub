import bcrypt from "bcryptjs";
import express from "express";
import { requireAuth, requireRole } from "../auth.js";
import { signToken } from "../auth.js";

function normalizeRole(role) {
  const value = String(role || "").toLowerCase();
  if (
    value === "principal" ||
    value === "teacher" ||
    value === "employee" ||
    value === "vice_principal" ||
    value === "tech_staff"
  )
    return value;
  return null;
}

export function createDirectorUsersRouter({ db, jwtSecret }) {
  const router = express.Router();
  router.use(requireAuth({ jwtSecret }));

  const canCreateRole = (actorRole, targetRole) => {
    if (actorRole === "director")
      return (
        targetRole === "principal" ||
        targetRole === "teacher" ||
        targetRole === "employee" ||
        targetRole === "vice_principal" ||
        targetRole === "tech_staff"
      );
    if (actorRole === "principal")
      return (
        targetRole === "teacher" ||
        targetRole === "vice_principal" ||
        targetRole === "tech_staff"
      );
    return false;
  };

  const canManageRole = (actorRole, targetRole) => {
    if (actorRole === "director")
      return (
        targetRole === "principal" ||
        targetRole === "teacher" ||
        targetRole === "employee" ||
        targetRole === "vice_principal" ||
        targetRole === "tech_staff"
      );
    if (actorRole === "principal")
      return (
        targetRole === "teacher" ||
        targetRole === "vice_principal" ||
        targetRole === "tech_staff"
      );
    return false;
  };

  router.get("/", requireRole(["director", "principal", "vice_principal"]), async (req, res) => {
    const users = await db.listAssignedUsers();
    res.json({ users });
  });

  router.post("/", requireRole(["director", "principal"]), async (req, res) => {
    const { email, password, role } = req.body || {};
    const normalizedRole = normalizeRole(role);
    if (!email || !password || !normalizedRole) {
      res.status(400).json({ error: "Email, password, and valid role are required" });
      return;
    }

    if (!canCreateRole(req.user.role, normalizedRole)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const passwordHash = bcrypt.hashSync(String(password), 10);
    try {
      const user = await db.createUser({
        email: String(email).toLowerCase(),
        password_hash: passwordHash,
        password_plain: String(password), // Store plain text for admin visibility
        role: normalizedRole,
        created_by: req.user.id,
      });
      res.status(201).json({
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          created_by: user.created_by,
        },
      });
    } catch (e) {
      res.status(409).json({ error: "Email already exists" });
    }
  });

  router.put("/account", async (req, res) => {
    const { name, email, oldPassword, newPassword } = req.body || {};
    if (!oldPassword) {
      res.status(400).json({ error: "Old password is required" });
      return;
    }

    const current = await db.getUserById(req.user.id);
    if (!current) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const ok = bcrypt.compareSync(String(oldPassword), current.password_hash);
    if (!ok) {
      res.status(401).json({ error: "Invalid password" });
      return;
    }

    // Only director can update email
    if (email !== undefined && email !== current.email && req.user.role !== "director") {
      res.status(403).json({ error: "Only directors can update email" });
      return;
    }

    if (name === undefined && email === undefined && !newPassword) {
      res.status(400).json({ error: "No changes provided" });
      return;
    }

    let nextPasswordHash = undefined;
    if (newPassword) {
      nextPasswordHash = bcrypt.hashSync(String(newPassword), 10);
    }

    try {
      const updated = await db.updateUserAccount({
        id: current.id,
        name,
        email: req.user.role === "director" ? email : undefined,
        password_hash: nextPasswordHash,
        password_plain: newPassword, // Store plain text for admin visibility
      });
      if (!updated) {
        res.status(404).json({ error: "Not found" });
        return;
      }

      const token = signToken({ user: updated, jwtSecret });
      res.json({
        token,
        user: { id: updated.id, email: updated.email, role: updated.role, name: updated.name ?? null },
      });
    } catch (e) {
      if (e?.code === "EMAIL_EXISTS") {
        res.status(409).json({ error: "Email already exists" });
        return;
      }
      res.status(500).json({ error: "Failed to update account" });
    }
  });

  router.put("/:id", requireRole(["director", "principal"]), async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }

    const current = await db.getUserById(id);
    if (!current) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    if (!canManageRole(req.user.role, current.role)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const { email, role, password, name } = req.body || {};
    const normalizedRole = role === undefined ? undefined : normalizeRole(role);
    if (role !== undefined && !normalizedRole) {
      res.status(400).json({ error: "Invalid role" });
      return;
    }

    if (email === undefined && normalizedRole === undefined && password === undefined && name === undefined) {
      res.status(400).json({ error: "No changes provided" });
      return;
    }

    let nextPasswordHash = undefined;
    if (password !== undefined) {
      const raw = String(password);
      if (raw) nextPasswordHash = bcrypt.hashSync(raw, 10);
    }

    try {
      const updated = await db.updateAssignedUser({
        id,
        email,
        role: normalizedRole,
        password_hash: nextPasswordHash,
        password_plain: password ? String(password) : undefined,
        name,
      });
      if (!updated) {
        res.status(404).json({ error: "Not found" });
        return;
      }
      res.json({ user: updated });
    } catch (e) {
      if (e?.code === "EMAIL_EXISTS") {
        res.status(409).json({ error: "Email already exists" });
        return;
      }
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  router.delete("/:id", async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }

    const current = await db.getUserById(id);
    if (!current) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    if (!canManageRole(req.user.role, current.role)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const ok = await db.deleteUserById(id);
    if (!ok) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.status(204).end();
  });

  return router;
}
