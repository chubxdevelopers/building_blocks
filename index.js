import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoute.js";
import adminRoutes from "./routes/adminRoute.js";
import publicRoutes from "./routes/publicRoute.js";
import userRoutes from "./routes/userRoute.js";
import appRoutes from "./routes/appRoute.js";
import { appContext } from "./middleware/appContext.js";

dotenv.config();
const app = express();

app.use(express.json());
app.use(cookieParser());
// Attach app/company context (reads first segment after /api)
app.use(appContext);

// Routes
// Mount routes under an app slug so frontend can call /api/:appSlug/... for multi-tenant behavior
app.use("/api/:appSlug/auth", authRoutes);
app.use("/api/:appSlug/admin", adminRoutes);
app.use("/api/:appSlug/public", publicRoutes);
app.use("/api/:appSlug/user", userRoutes);
app.use("/api/:appSlug/app", appRoutes);

app.listen(process.env.PORT, () => {
  console.log(`✅ Server running on port ${process.env.PORT}`);
});
