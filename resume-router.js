import express from "express";
import multer from "multer";
import { extractResumeProfile } from "./resume-parser.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 1, fields: 0 },
  fileFilter: (_req, file, callback) => {
    if (/\.(pdf|docx?|PDF|DOCX?)$/.test(file.originalname || "")) callback(null, true);
    else callback(Object.assign(new Error("Use a PDF, DOCX, or DOC file."), { status: 400 }));
  },
});

export function createResumeRouter() {
  const router = express.Router();
  router.post("/extract", (req, res) => {
    upload.single("resume")(req, res, async (uploadError) => {
      if (uploadError) {
        const sizeError = uploadError instanceof multer.MulterError && uploadError.code === "LIMIT_FILE_SIZE";
        return res.status(400).json({ error: sizeError ? "The resume is larger than 8 MB." : uploadError.message });
      }
      try { res.json(await extractResumeProfile(req.file)); }
      catch (error) { res.status(error.status || 500).json({ error: error.status ? error.message : "We could not process this resume." }); }
    });
  });
  return router;
}
