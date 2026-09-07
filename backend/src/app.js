import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/auth.js";
import doctorRoutes from "./routes/doctor.js";
import patientRoutes from "./routes/patient.js";
import appointmentRoutes from "./routes/appointment.js";
import scheduleRoutes from "./routes/schedule.js";
import adminRoutes from "./routes/admin.js";
import serviceRoutes from "./routes/service.js";
import medicalRecordRoutes from "./routes/medicalRecord.js";
import aiRoutes from "./routes/ai.js";
import { auth, role } from "./middleware/auth.js";
import "./telegram.js";
import "./cron.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));


app.use((req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = (data) => {
    const stringify = (obj) => {
      if (obj === null || obj === undefined) return obj;
      if (typeof obj === 'bigint') return obj.toString();
      if (obj instanceof Date) return obj.toISOString();
      if (Array.isArray(obj)) return obj.map(stringify);
      if (typeof obj === 'object') {
        const result = {};
        for (const key in obj) {
          result[key] = stringify(obj[key]);
        }
        return result;
      }
      return obj;
    };
    return originalJson(stringify(data));
  };
  next();
});

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use("/auth", authRoutes);
app.use("/doctor", doctorRoutes);
app.use("/patient", patientRoutes);
app.use("/appointment", appointmentRoutes);
app.use("/schedule", scheduleRoutes);
app.use("/admin", adminRoutes);
app.use("/service", serviceRoutes);
app.use("/medical-record", medicalRecordRoutes);
app.use("/ai", aiRoutes);

app.get("/profile", auth, (req, res) => {
  res.json({ message: "Доступ разрешён", user: req.user });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
