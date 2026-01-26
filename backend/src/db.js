import mongoose from "mongoose";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Schemas ---

const CounterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});
const Counter = mongoose.models.Counter || mongoose.model("Counter", CounterSchema);

const UserSchema = new mongoose.Schema({
  id: { type: Number, unique: true, required: true },
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  password_plain: { type: String }, // Storing plain text password for visibility
  role: { type: String, required: true },
  name: String,
  created_by: Number,
  created_at: String,
  updated_at: String,
});
const User = mongoose.models.User || mongoose.model("User", UserSchema);

const PasswordResetSchema = new mongoose.Schema({
  id: { type: Number, unique: true, required: true },
  user_id: { type: Number, required: true },
  otp_hash: String,
  otp_expires_at: String,
  otp_attempts: { type: Number, default: 0 },
  reset_token_hash: String,
  reset_token_expires_at: String,
  verified_at: String,
  created_at: String,
  updated_at: String,
});
const PasswordReset = mongoose.models.PasswordReset || mongoose.model("PasswordReset", PasswordResetSchema);

// Flexible Content Schema Definition
const ContentSchemaDef = {
  id: { type: Number, unique: true, required: true },
  created_by: Number,
  created_at: String,
  updated_at: String,
};

// Create models with strict: false to accept any fields
const createContentModel = (name) => 
  mongoose.models[name] || mongoose.model(name, new mongoose.Schema(ContentSchemaDef, { strict: false }));

const Meeting = createContentModel("Meeting");
const Vote = createContentModel("Vote");
const News = createContentModel("News");
const Official = createContentModel("Official");
const Contract = createContentModel("Contract");
const Benefit = createContentModel("Benefit");
const Faq = createContentModel("Faq");
const Notification = createContentModel("Notification");
const EmployeeContent = createContentModel("EmployeeContent");

const modelsByType = {
  meetings: Meeting,
  votes: Vote,
  news: News,
  officials: Official,
  contracts: Contract,
  benefits: Benefit,
  faqs: Faq,
  notifications: Notification,
  employees: EmployeeContent,
};

function getModel(type) {
  return modelsByType[type] || null;
}

// --- Helpers ---

async function getNextId(name) {
  const ret = await Counter.findByIdAndUpdate(
    name,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return ret.seq;
}

function nowIso() {
  return new Date().toISOString();
}

function sanitizeUser(userDoc) {
  if (!userDoc) return null;
  const obj = userDoc.toObject ? userDoc.toObject() : userDoc;
  // We keep password_plain visible for admin if needed, or remove it?
  // User requested to "show real password".
  // So we should NOT delete password_plain if the requester is authorized.
  // However, sanitizeUser is used generally.
  // Let's keep it in the object but remove password_hash.
  const { password_hash, _id, __v, ...rest } = obj;
  return rest;
}

async function migrateIfNeeded() {
  try {
    const userCount = await User.countDocuments();
    
    // If we have users, we might need to migrate content from old 'contents' collection
    // to new specific collections if they are empty.
    
    // Check if 'Meeting' is empty (as a proxy for new collections being empty)
    const meetingCount = await Meeting.countDocuments();
    if (meetingCount > 0) {
      // Already migrated to new structure?
      return;
    }

    console.log("Checking for data migration...");

    // 1. Try migrating from 'contents' collection (previous migration)
    const oldContentColl = mongoose.connection.db.collection('contents');
    const oldContentCount = await oldContentColl.countDocuments();

    if (oldContentCount > 0) {
      console.log("Migrating from generic 'contents' collection to specific collections...");
      const cursor = oldContentColl.find({});
      for await (const doc of cursor) {
        const { type, data, id, created_by, created_at, updated_at } = doc;
        const Model = getModel(type);
        if (Model) {
          const exists = await Model.findOne({ id });
          if (!exists) {
             let payload = {};
             try {
                payload = typeof data === 'string' ? JSON.parse(data) : data;
             } catch (e) {}
             // Exclude _id from payload if it exists
             const { _id, ...cleanPayload } = payload;
             await Model.create({ id, created_by, created_at, updated_at, ...cleanPayload });
          }
        }
      }
      console.log("Migration from 'contents' complete.");
      return;
    }

    // 2. Fallback: Migrate from db.json
    const dbPath = path.join(__dirname, "..", "data", "db.json");
    if (!fs.existsSync(dbPath)) return;
    
    // Only if users are also missing (fresh start) or just content missing
    if (userCount === 0) {
        console.log("Migrating data from db.json to MongoDB...");
        const raw = fs.readFileSync(dbPath, "utf8");
        const data = JSON.parse(raw);

        if (data.counters) {
            await Counter.findByIdAndUpdate("users", { seq: data.counters.users }, { upsert: true });
            await Counter.findByIdAndUpdate("content", { seq: data.counters.content }, { upsert: true });
            await Counter.findByIdAndUpdate("passwordResets", { seq: data.counters.passwordResets }, { upsert: true });
        }

        if (Array.isArray(data.users)) {
            for (const u of data.users) {
                const { _id, ...rest } = u;
                await User.create(rest);
            }
        }

        if (Array.isArray(data.content)) {
            for (const c of data.content) {
                const { _id, type, data: contentData, ...rest } = c;
                const Model = getModel(type);
                if (Model) {
                    let payload = {};
                    try {
                        payload = typeof contentData === 'string' ? JSON.parse(contentData) : contentData;
                    } catch (e) {}
                    await Model.create({ ...rest, ...payload });
                }
            }
        }

        if (Array.isArray(data.passwordResets)) {
            for (const p of data.passwordResets) {
                const { _id, ...rest } = p;
                await PasswordReset.create(rest);
            }
        }
        console.log("Migration from db.json complete.");
    }

  } catch (err) {
    console.error("Migration failed:", err);
  }
}

// --- DB Interface ---

export function createDb({ dbPath }) {
  return {
    async connect() {
      if (mongoose.connection.readyState === 1) return;
      const uri = process.env.MONGODB_URI;
      if (!uri) throw new Error("MONGODB_URI is missing in .env");
      
      // Use lower timeout for serverless to fail fast if connection issues
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
      });

      // Skip migration in Vercel environment to prevent function timeouts
      if (process.env.VITE_VERCEL !== '1') {
        await migrateIfNeeded();
      }
    },

    async getDirectorCount() {
      return await User.countDocuments({ role: "director" });
    },

    async getUserByEmail(email) {
      const user = await User.findOne({ email }).lean();
      return user ? { ...user } : null;
    },

    async getUserByEmailRole(email, role) {
      const user = await User.findOne({ email, role }).lean();
      return user ? { ...user } : null;
    },

    async getUserById(id) {
      const user = await User.findOne({ id }).lean();
      return user ? { ...user } : null;
    },

    async emailExists(email) {
      const count = await User.countDocuments({ email });
      return count > 0;
    },

    async upsertPasswordResetOtp({ user_id, otp_hash, otp_expires_at }) {
      const now = Date.now();
      await PasswordReset.deleteMany({ user_id });
      const id = await getNextId("passwordResets");
      await PasswordReset.create({
        id,
        user_id,
        otp_hash,
        otp_expires_at,
        otp_attempts: 0,
        reset_token_hash: null,
        reset_token_expires_at: null,
        created_at: nowIso(),
        updated_at: nowIso(),
      });
      return true;
    },

    async getPasswordResetByUserId(user_id) {
      const reset = await PasswordReset.findOne({ user_id }).lean();
      return reset ? { ...reset } : null;
    },

    async incrementPasswordResetOtpAttempts(user_id) {
      const reset = await PasswordReset.findOne({ user_id });
      if (!reset) return null;
      const next = (reset.otp_attempts || 0) + 1;
      reset.otp_attempts = next;
      reset.updated_at = nowIso();
      await reset.save();
      return next;
    },

    async setPasswordResetToken({ user_id, reset_token_hash, reset_token_expires_at }) {
      const reset = await PasswordReset.findOne({ user_id });
      if (!reset) return false;
      reset.otp_hash = null;
      reset.otp_expires_at = null;
      reset.otp_attempts = 0;
      reset.reset_token_hash = reset_token_hash;
      reset.reset_token_expires_at = reset_token_expires_at;
      reset.verified_at = nowIso();
      reset.updated_at = nowIso();
      await reset.save();
      return true;
    },

    async consumePasswordResetToken(reset_token_hash) {
      const reset = await PasswordReset.findOne({ reset_token_hash });
      if (!reset) return null;
      const userId = reset.user_id;
      await PasswordReset.deleteOne({ _id: reset._id });
      return userId;
    },

    async createUser({ email, password_hash, password_plain, role, created_by, name }) {
      const exists = await User.exists({ email });
      if (exists) {
        const err = new Error("Email exists");
        err.code = "EMAIL_EXISTS";
        throw err;
      }
      const id = await getNextId("users");
      const user = await User.create({
        id,
        email,
        password_hash,
        password_plain,
        role,
        name: name ?? null,
        created_by: created_by ?? null,
        created_at: nowIso(),
      });
      return sanitizeUser(user);
    },

    async updateUserAccount({ id, email, name, password_hash, password_plain }) {
      const user = await User.findOne({ id });
      if (!user) return null;
      if (email !== undefined) {
        const nextEmail = String(email).toLowerCase();
        const conflict = await User.findOne({ email: nextEmail, id: { $ne: id } });
        if (conflict) {
          const err = new Error("Email exists");
          err.code = "EMAIL_EXISTS";
          throw err;
        }
        user.email = nextEmail;
      }
      if (name !== undefined) user.name = name === null ? null : String(name);
      if (password_hash !== undefined) user.password_hash = password_hash;
      if (password_plain !== undefined) user.password_plain = password_plain;
      user.updated_at = nowIso();
      await user.save();
      return sanitizeUser(user);
    },

    async updateAssignedUser({ id, email, role, password_hash, password_plain, name }) {
      const user = await User.findOne({ id });
      if (!user) return null;
      const currentRole = user.role;
      if (currentRole !== "principal" && currentRole !== "teacher" && currentRole !== "employee") return null;
      if (email !== undefined) {
        const nextEmail = String(email).toLowerCase();
        const conflict = await User.findOne({ email: nextEmail, id: { $ne: id } });
        if (conflict) {
          const err = new Error("Email exists");
          err.code = "EMAIL_EXISTS";
          throw err;
        }
        user.email = nextEmail;
      }
      if (role !== undefined) user.role = role;
      if (name !== undefined) user.name = name === null ? null : String(name);
      if (password_hash !== undefined) user.password_hash = password_hash;
      if (password_plain !== undefined) user.password_plain = password_plain;
      user.updated_at = nowIso();
      await user.save();
      return sanitizeUser(user);
    },

    async deleteUserById(id) {
      const res = await User.deleteOne({ id });
      return res.deletedCount > 0;
    },

    async listAssignedUsers() {
      const users = await User.find({
        role: {
          $in: ["principal", "teacher", "employee", "vice_principal", "tech_staff"],
        },
      })
        .sort({ id: -1 })
        .lean();
      return users.map((u) => {
        const { _id, __v, password_hash, ...rest } = u;
        return rest;
      });
    },

    async getAllUserEmails() {
      const users = await User.find({}, "email").lean();
      return users.map((u) => u.email);
    },

    async getDirectorEmails() {
      const users = await User.find({ role: "director" }, "email").lean();
      return users.map((u) => u.email);
    },

    async listContentByType(type) {
      const Model = getModel(type);
      if (!Model) return [];
      const docs = await Model.find().sort({ id: -1 }).lean();

      // Collect creator IDs to fetch emails
      const creatorIds = [...new Set(docs.map((d) => d.created_by).filter((id) => id != null))];
      const users = await User.find({ id: { $in: creatorIds } }, "id email").lean();
      const userMap = new Map(users.map((u) => [u.id, u.email]));

      return docs.map(doc => {
        // Reconstruct expected interface: { id, type, data: {...payload}, ...meta }
        const { _id, __v, id, created_by, created_at, updated_at, ...payload } = doc;
        return {
          id,
          type,
          data: payload, // Return payload object directly
          created_by,
          creator_email: userMap.get(created_by) || null,
          created_at,
          updated_at,
        };
      });
    },

    async getContentById(type, id) {
      const Model = getModel(type);
      if (!Model) return null;
      const doc = await Model.findOne({ id }).lean();
      if (!doc) return null;
      const { _id, __v, id: docId, created_by, created_at, updated_at, ...payload } = doc;
      return {
        id: docId,
        type,
        data: payload,
        created_by,
        created_at,
        updated_at,
      };
    },

    async createContent({ type, data, created_by }) {
      const Model = getModel(type);
      if (!Model) throw new Error(`Unknown content type: ${type}`);
      const id = await getNextId("content");
      const payload = data ?? {};
      const doc = await Model.create({
        id,
        created_by,
        created_at: nowIso(),
        updated_at: nowIso(),
        ...payload
      });
      // Return in same format as get
      const { _id, __v, id: docId, created_by: cb, created_at: ca, updated_at: ua, ...savedPayload } = doc.toObject();
      return {
        id: docId,
        type,
        data: savedPayload,
        created_by: cb,
        created_at: ca,
        updated_at: ua,
      };
    },

    async updateContent({ type, id, data }) {
      const Model = getModel(type);
      if (!Model) return null;
      const doc = await Model.findOne({ id });
      if (!doc) return null;
      
      const payload = data ?? {};
      // Update fields
      Object.assign(doc, payload);
      doc.updated_at = nowIso();
      // Since schema is strict:false, new fields in payload are added to doc
      // Mongoose might need markModified if we were using Mixed type, but with strict:false and top level keys, it should detect changes or we use set()
      // Ideally set() is safer.
      for (const [key, value] of Object.entries(payload)) {
          doc.set(key, value);
      }
      
      await doc.save();
      
      const { _id, __v, id: docId, created_by, created_at, updated_at, ...savedPayload } = doc.toObject();
      return {
        id: docId,
        type,
        data: savedPayload,
        created_by,
        created_at,
        updated_at,
      };
    },

    async deleteContent({ type, id }) {
      const Model = getModel(type);
      if (!Model) return false;
      const res = await Model.deleteOne({ id });
      return res.deletedCount > 0;
    },

    async getLatestNotificationSettings() {
      const Notification = getModel("notifications");
      // Find where kind is "reminder_settings", sort by id desc
      const doc = await Notification.findOne({ kind: "reminder_settings" }).sort({ id: -1 }).lean();
      if (!doc) return null;
      const { _id, __v, id, created_by, created_at, updated_at, ...data } = doc;
      return { id, data, created_at };
    },

    async getPendingReminders(type) {
      const Model = getModel(type);
      if (!Model) return [];
      const docs = await Model.find({ reminderSent: { $ne: true } }).lean();
      return docs.map((doc) => {
        const { _id, __v, id, created_by, created_at, updated_at, ...data } = doc;
        return { id, data: { ...data }, created_at };
      });
    },

    async markReminderSent(type, id) {
      const Model = getModel(type);
      if (!Model) return;
      await Model.updateOne({ id }, { $set: { reminderSent: true } });
    },
  };
}
