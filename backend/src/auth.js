import jwt from "jsonwebtoken";

export function signToken({ user, jwtSecret, expiresIn = "7d" }) {
  return jwt.sign(
    { sub: String(user.id), role: user.role, email: user.email },
    jwtSecret,
    { expiresIn }
  );
}

export function requireAuth({ jwtSecret }) {
  return (req, res, next) => {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");
    if (scheme !== "Bearer" || !token) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    try {
      const payload = jwt.verify(token, jwtSecret);
      req.user = {
        id: Number(payload.sub),
        role: payload.role,
        email: payload.email,
      };
      next();
    } catch {
      res.status(401).json({ error: "Unauthorized" });
    }
  };
}

export function requireRole(roles) {
  const allowed = new Set(Array.isArray(roles) ? roles : [roles]);
  return (req, res, next) => {
    if (!req.user || !allowed.has(req.user.role)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  };
}

