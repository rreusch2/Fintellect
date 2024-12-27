import express, { type Express } from "express";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { type Server } from "http";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  if (process.env.NODE_ENV === 'production') {
    return serveStatic(app);
  }

  const { createServer: createViteServer, createLogger } = await import('vite');
  const viteConfig = await import('../vite.config');
  const viteLogger = createLogger();

  const vite = await createViteServer({
    ...viteConfig.default,
    configFile: false,
    customLogger: viteLogger,
    server: {
      middlewareMode: true,
      hmr: { server },
    },
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path.resolve(__dirname, "..", "client", "index.html");
      const template = await fs.promises.readFile(clientTemplate, "utf-8");
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const publicPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(publicPath)) {
    log(`Public directory not found at ${publicPath}`);
    return;
  }
  
  app.use(express.static(publicPath));
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(publicPath, "index.html"));
  });
}
