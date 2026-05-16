import { loadEnvFile } from "process";
try { loadEnvFile(".env"); } catch {}

import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import compression from "compression";
import { registerRoutes } from "./routes";
import { startReminderScheduler } from "./reminder";
import { serveStatic } from "./static";
import { createServer } from "http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";
import path from "path";

const app = express();
const httpServer = createServer(app);

app.use(compression());

// CORS — allow the frontend origin (cPanel) to call this API
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (mobile apps, curl, etc.)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
    credentials: true,
  })
);


const PgSession = connectPgSimple(session);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}

app.use(
  session({
    store: new PgSession({
      pool,
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || "local-goa-kayaking-secret",
    name: "sid",
    resave: false,
    rolling: true,
    saveUninitialized: true,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    },
  })
);

app.use((req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === "production") {
    const host = req.headers.host || "";
    if (host.startsWith("www.")) {
      const nonWww = host.slice(4);
      return res.redirect(301, `https://${nonWww}${req.originalUrl}`);
    }
  }
  next();
});

app.use((req: Request, _res: Response, next: NextFunction) => {
  if (req.path.startsWith("/api") && !req.session) {
    console.error("[SESSION] req.session is undefined for", req.method, req.path);
    (req as any).session = { userId: undefined, save: (cb: Function) => cb(), destroy: (cb: Function) => cb() };
  }
  next();
});

app.use(
  express.json({
    limit: "20mb",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false, limit: "20mb" }));

app.use("/uploads", express.static(path.join(process.cwd(), "public/uploads"), {
  maxAge: "7d",
  etag: true,
}));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);
  startReminderScheduler();

  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error(`[ERROR] ${req.method} ${req.path} → ${message}`);
    console.error(err.stack || err);
    if (res.headersSent) return next(err);
    return res.status(status).json({ message });
  });

  // if (process.env.NODE_ENV === "production") {
  //   serveStatic(app);
  // } else {
  //   const { setupVite } = await import("./vite");
  //   await setupVite(httpServer, app);
  // }

  if (process.env.NODE_ENV === "production") {
    if (process.env.SERVE_STATIC === "true") {
      serveStatic(app);
    }
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(port, "0.0.0.0", () => {
  log(`serving on port ${port}`);
});
})();