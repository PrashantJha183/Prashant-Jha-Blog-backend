import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import pinoHttp from "pino-http";
import "express-async-errors";

import { errorHandler } from "./middlewares/error.middleware.js";
import { apiLimiter } from "./middlewares/apiLimiter.middleware.js";
import adminRoutes from "./routes/admin.routes.js";
import healthRoutes from "./routes/health.routes.js";
import authRoutes from "./routes/auth.routes.js";
import blogRoutes from "./routes/admin.blog.routes.js";
import publicRoutes from "./routes/publicBlog.routes.js";
import { swaggerServe, swaggerSetup } from "./swagger/index.js";
const app = express();

/* ========================
   Trust proxy (cloud / nginx)
======================== */
app.set("trust proxy", 1);

/* ========================
   Security
======================== */
app.use(helmet());

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:4173",
  "https://prashant-jhadev.netlify.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow non-browser requests (Postman, curl, server-to-server)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  }),
);

/* ========================
   Logging (EARLY)
======================== */
if (process.env.NODE_ENV !== "production") {
  app.use(
    pinoHttp({
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      },
    }),
  );
} else {
  app.use(pinoHttp());
}

/* ========================
   Performance
======================== */
app.use(compression());

/* ========================
   Body parsing
======================== */
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false }));

/* ========================
   Global API rate limiter
======================== */
app.use("/api", apiLimiter);
app.use("/api/docs", swaggerServe, swaggerSetup);
app.use((req, res, next) => {
  console.log("ROUTE HIT:", req.method, req.originalUrl);
  next();
});

/* ========================
   Routes (CRITICAL FIX)
======================== */
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/public-blogs", publicRoutes);

/* ========================
   Global error handler (LAST)
======================== */
app.use(errorHandler);

export default app;
