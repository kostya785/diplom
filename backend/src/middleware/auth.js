import jwt from "jsonwebtoken";

export function auth(req, res, next) {
  const header = req.headers.authorization;

  if (!header) {
    return res.status(401).json({ message: "Нет токена" });
  }

  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role }
    next();
  } catch (err) {
    return res.status(401).json({ message: "Неверный токен" });
  }
}

export function role(requiredRole) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Нет токена" });
    }

    if (req.user.role !== requiredRole) {
      return res.status(403).json({ message: "Нет доступа" });
    }

    next();
  };
}


export function roles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Нет токена" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Нет доступа" });
    }

    next();
  };
}


export function techAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: "Нет токена" });
  }

  if (req.user.role !== "tech_admin") {
    return res.status(403).json({ message: "Нет доступа" });
  }

  next();
}


export function clinicAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: "Нет токена" });
  }

  if (req.user.role !== "clinic_admin") {
    return res.status(403).json({ message: "Нет доступа" });
  }

  next();
}
