import express from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const dataDir = path.join(root, "data");
const backupDir = path.join(root, "backups");
const dataFile = path.join(dataDir, "financial-data.json");
const port = 3001;

const app = express();
app.use(express.json({ limit: "2mb" }));

async function ensureFolders() {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.mkdir(backupDir, { recursive: true });
}

async function readData() {
  await ensureFolders();
  try {
    return JSON.parse(await fs.readFile(dataFile, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

async function writeData(data) {
  await ensureFolders();
  const previous = await readData();
  if (previous) {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    await fs.writeFile(
      path.join(backupDir, "financial-data-" + stamp + ".json"),
      JSON.stringify(previous, null, 2),
      "utf8"
    );
  }
  const temp = dataFile + ".tmp";
  await fs.writeFile(temp, JSON.stringify(data, null, 2), "utf8");
  await fs.rename(temp, dataFile);
}

app.get("/api/data", async (_req, res) => {
  try {
    res.json({ data: await readData() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/data", async (req, res) => {
  try {
    await writeData(req.body);
    res.json({ ok: true, savedAt: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log("Local data service running at http://localhost:" + port);
  console.log("Data file: " + dataFile);
});
