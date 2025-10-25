import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRoutes from "./routes/authRoute.js";
import adminRoutes from "./routes/adminRoute.js";
import publicRoutes from "./routes/publicRoute.js";
import publicApiRoutes from "./routes/publicApiRoute.js";
import userRoutes from "./routes/userRoute.js";
import appRoutes from "./routes/appRoute.js";
import queryRoutes from "./routes/queryRoute.js";
import { appContext } from "./middleware/appContext.js";

dotenv.config();
const app = express();

app.use(express.json());

// Enable CORS. We reflect the incoming origin (origin: true) so the
// Access-Control-Allow-Origin header contains the request origin. This
// is convenient for local development across different ports and works
// with credentials (cookies) as we set credentials: true.
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(cookieParser());

// Attach app/company context (reads first segment after /api)
app.use(appContext);

// Routes
// Mount routes under company + app slugs so frontend can call /api/:company/:appSlug/... for multi-tenant behavior
app.use("/api/:company/:appSlug/auth", authRoutes);
app.use("/api/:company/:appSlug/admin", adminRoutes);
app.use("/api/:company/:appSlug/public", publicRoutes);
app.use("/api/:company/:appSlug/user", userRoutes);
app.use("/api/:company/:appSlug/app", appRoutes);
// Public endpoints that don't require company/app context (used by SelectCompany UI)
app.use("/api/public", publicApiRoutes);
// Expose a canonical query endpoint used by frontend clients: /api/query/v1/:resource
app.use("/api/query", queryRoutes);

app.listen(process.env.PORT, () => {
  console.log(`✅ Server running on port ${process.env.PORT}`);
});
