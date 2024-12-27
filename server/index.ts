import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { registerRoutes } from "./routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Serve static files from the dist/public directory
app.use(express.static(join(__dirname, "../public")));

// Register API routes
registerRoutes(app);

// Handle client-side routing
app.get("*", (req, res) => {
  // Don't serve index.html for API routes
  if (req.path.startsWith("/api")) {
    return res.status(404).send("API endpoint not found");
  }
  res.sendFile(join(__dirname, "../public/index.html"));
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});