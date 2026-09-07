import { Router } from "express";
import prisma from "../prisma/client.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendVerificationEmail } from "../utils/email.js";

const router = Router();


router.post("/register", async (req, res) => {
  try {
    const { email, password, fullName, phone, birthDate, gender, address, dataConsent } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({ message: "Заполните обязательные поля" });
    }

    if (!gender || !["MALE", "FEMALE"].includes(gender)) {
      return res.status(400).json({ message: "Укажите пол (мужской или женский)" });
    }

    if (!dataConsent) {
      return res.status(400).json({ message: "Необходимо согласие на обработку персональных данных" });
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      console.log("Email already used by user:", { id: exists.id, email: exists.email, role: exists.role });
      return res.status(400).json({ message: "Email уже используется" });
    }

    const hash = await bcrypt.hash(password, 10);
    const emailVerifyToken = crypto.randomBytes(32).toString("hex");
    const emailVerifyExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 часа

    console.log("Creating user with email verify token:", emailVerifyToken.substring(0, 20) + "...");

    const user = await prisma.user.create({
      data: {
        email,
        password: hash,
        role: "patient",
        emailVerifyToken,
        emailVerifyExpiry
      }
    });

    console.log("User created with ID:", user.id, "and token:", user.emailVerifyToken.substring(0, 20) + "...");

    await prisma.patient.create({
      data: {
        userId: user.id,
        fullName,
        phone,
        birthDate: birthDate ? new Date(birthDate) : null,
        gender,
        address,
        dataConsent: true,
        dataConsentDate: new Date()
      }
    });

    await sendVerificationEmail(email, emailVerifyToken);

    res.json({
      id: user.id,
      email: user.email,
      role: user.role,
      message: "На вашу почту отправлено письмо с подтверждением регистрации"
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});


router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
 
      await prisma.authLog.create({
        data: {
          userId: null,
          email,
          ipAddress,
          userAgent,
          success: false,
          failureReason: "User not found"
        }
      });
      return res.status(400).json({ message: "Неверный email" });
    }


    if (user.isBanned) {
      if (user.banUntil && user.banUntil > new Date()) {
        await prisma.authLog.create({
          data: {
            userId: user.id,
            email,
            ipAddress,
            userAgent,
            success: false,
            failureReason: "User is banned"
          }
        });
        return res.status(403).json({ message: "Аккаунт заблокирован" });
      } else {
       
        await prisma.user.update({
          where: { id: user.id },
          data: {
            isBanned: false,
            banReason: null,
            banUntil: null
          }
        });
      }
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
   
      await prisma.authLog.create({
        data: {
          userId: user.id,
          email,
          ipAddress,
          userAgent,
          success: false,
          failureReason: "Invalid password"
        }
      });
      return res.status(400).json({ message: "Неверный пароль" });
    }

    if (user.role === "patient" && !user.emailVerified) {
      await prisma.authLog.create({
        data: {
          userId: user.id,
          email,
          ipAddress,
          userAgent,
          success: false,
          failureReason: "Email not verified"
        }
      });
      return res.status(403).json({ message: "Email не подтверждён. Пожалуйста, проверьте почту." });
    }

   
    await prisma.authLog.create({
      data: {
        userId: user.id,
        email,
        ipAddress,
        userAgent,
        success: true
      }
    });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});


router.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: "Нет токена" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        role: true,
        patient: {
          select: {
            gender: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }

    const response = {
      id: user.id,
      email: user.email,
      role: user.role,
      gender: user.patient?.gender || null
    };

    res.json(response);
  } catch (err) {
    console.error("Auth me error:", err);
    res.status(401).json({ message: "Неверный токен" });
  }
});



router.post("/login-admin", async (req, res) => {
  try {
    const { email, password } = req.body;
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      await prisma.authLog.create({
        data: {
          userId: null,
          email,
          ipAddress,
          userAgent,
          success: false,
          failureReason: "User not found"
        }
      });
      return res.status(400).json({ message: "Неверный email" });
    }

    if (user.role !== "tech_admin" && user.role !== "clinic_admin") {
      await prisma.authLog.create({
        data: {
          userId: user.id,
          email,
          ipAddress,
          userAgent,
          success: false,
          failureReason: "Not an admin"
        }
      });
      return res.status(403).json({ message: "Доступ только для администраторов" });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      await prisma.authLog.create({
        data: {
          userId: user.id,
          email,
          ipAddress,
          userAgent,
          success: false,
          failureReason: "Invalid password"
        }
      });
      return res.status(400).json({ message: "Неверный пароль" });
    }

    await prisma.authLog.create({
      data: {
        userId: user.id,
        email,
        ipAddress,
        userAgent,
        success: true
      }
    });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token });
  } catch (err) {
    console.error("Login admin error:", err);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

router.post("/verify-email", async (req, res) => {
  try {
    const { token, action } = req.body;

    console.log("Verify email request:", { token: token?.substring(0, 20) + "...", action });

    if (!token) {
      return res.status(400).json({ message: "Токен отсутствует" });
    }

    const user = await prisma.user.findUnique({
      where: { emailVerifyToken: token }
    });

    if (!user) {
      console.log("User not found for token");
      return res.status(400).json({ message: "Неверный или просроченный токен" });
    }

    console.log("User found:", { id: user.id, email: user.email, expiry: user.emailVerifyExpiry });

    if (user.emailVerifyExpiry < new Date()) {
      console.log("Token expired");
      return res.status(400).json({ message: "Срок действия токена истёк. Пожалуйста, зарегистрируйтесь снова." });
    }

    if (action === "reject") {
      await prisma.user.delete({ where: { id: user.id } });
      return res.json({ message: "Регистрация отменена" });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifyToken: null,
        emailVerifyExpiry: null
      }
    });

    console.log("Email verified successfully for:", user.email);
    res.json({ message: "Email успешно подтверждён" });
  } catch (err) {
    console.error("Verify email error:", err);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});


export default router;
