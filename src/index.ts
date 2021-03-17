import express from "express";
import { v4 as uuidv4 } from "uuid";
import GoogleCloud from "./cloud";

const port = process.env.PORT || 8080;
const app = express();

app.use(express.json());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

const googleCloud = new GoogleCloud();

app.post("/upload-uidl", async (req, res) => {
  const {
    uidl,
    type,
  }: {
    uidl: string;
    type: "component" | "project";
  } = req.body;

  if (!uidl) {
    return res.status(400).json({ message: "UIDL missing from the request" });
  }
  if (!["project", "component"].includes(type)) {
    return res
      .status(400)
      .json({ message: "Type must be project or component" });
  }

  try {
    JSON.parse(uidl);
    if (typeof uidl !== "string") {
      throw new Error("Requested UIDL is not a string");
    }
  } catch (e) {
    console.error(e);
    return res
      .status(400)
      .json({ message: "Please send a properly structured UIDL" });
  }

  const fileName = uuidv4();
  try {
    await googleCloud.uploadUIDL(uidl, fileName, type);
    return res
      .status(200)
      .json({ message: "UIDL saved successfully", fileName });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Failed in saving UIDL" });
  }
});

app.get("/fetch-uidl/:type/:fileName", async (req, res) => {
  const { fileName, type } = req.params;

  if (!fileName) {
    return res
      .status(400)
      .json({ message: "Filename is missing from the request" });
  }
  if (!["project", "component"].includes(type)) {
    return res
      .status(400)
      .json({ message: "Type must be project or component" });
  }

  try {
    const uidl = await googleCloud.fetchUIDL(
      fileName,
      type as "project" | "component"
    );
    if (!uidl) {
      return res.status(404).json({ message: "File not found" });
    }
    return res.status(200).json({ uidl });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Failed in fetching UIDL" });
  }
});

app.get("/", (req, res) => res.send("REPL API server"));

if (process.env.NODE_ENV !== "production") {
  app.listen(port, () => {
    console.log(`Server running on ${port}`);
  });
}

export { app };
