const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const app = express();
const PORT = 5000;

// 실제 폴더 루트 경로 (기본 탐색 시작점)
const ROOT_PATH = "C:/Users/Park/Downloads/Sample/01.원천데이터/8월/220801/C/A";

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 윈도우 금지문자 제거
const encodePath = (fullPath) => fullPath.replace(/[\\/:*?"<>|]/g, "_");

// ✅ 폴더 구조 재귀 탐색
function getFolderStructure(dirPath) {
  try {
    const items = fs.readdirSync(dirPath);
    return items.map((item) => {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      const isDirectory = stat.isDirectory();

      return {
        id: encodePath(fullPath),
        fullPath: fullPath,
        name: item,
        children: isDirectory ? getFolderStructure(fullPath) : [],
      };
    });
  } catch (err) {
    console.error(`❌ 디렉토리 읽기 실패: ${dirPath}`, err.message);
    return [];
  }
}

// 📁 폴더 구조 API
app.get("/api/folder-structure", (req, res) => {
  console.log("📥 [GET] /api/folder-structure");
  if (!fs.existsSync(ROOT_PATH)) {
    console.error("❗ ROOT_PATH가 존재하지 않음:", ROOT_PATH);
    return res.status(404).json({ error: "지정한 폴더가 존재하지 않습니다." });
  }

  const structure = getFolderStructure(ROOT_PATH);
  res.json(structure);
});

// 📄 CSV 파일 읽기 API
// 📄 CSV 파일 읽기 API (상위 500개 행만 처리)
app.get("/api/read-csv", (req, res) => {
  const { filePath } = req.query;

  if (!filePath || !fs.existsSync(filePath)) {
    return res.status(400).json({ error: "유효한 filePath가 필요합니다." });
  }

  try {
    const data = fs.readFileSync(filePath, "utf8");
    const lines = data.split(/\r?\n/).filter(Boolean);
    const [headerLine, ...rows] = lines;
    const headers = headerLine.split(",");

    const MAX_ROWS = 500;
    const limitedRows = rows.slice(0, MAX_ROWS);  // ✅ 상위 500개 행만

    const parsed = limitedRows.map((line) => {
      const cols = line.split(",");
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = cols[i] ?? "";
      });
      return obj;
    });

    res.json({ headers, rows: parsed });
  } catch (err) {
    console.error("❌ CSV 읽기 실패:", err.message);
    res.status(500).json({ error: "CSV 읽기 중 오류 발생" });
  }
});

// ⬇ CSV 다운로드 API
app.get("/api/download", (req, res) => {
  const filePath = req.query.filePath;

  if (!filePath || !fs.existsSync(filePath)) {
    return res.status(404).json({ error: "파일이 존재하지 않습니다." });
  }

  res.download(filePath, (err) => {
    if (err) {
      console.error("❌ 다운로드 오류:", err.message);
      res.status(500).send("파일 다운로드 실패");
    }
  });
});

// ⬆ CSV 업로드 API (사용자 지정 경로로 업로드)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const targetPath = req.body.targetPath;
    if (!targetPath || !fs.existsSync(targetPath)) {
      console.error("❌ 유효하지 않은 업로드 경로:", targetPath);
      return cb(new Error("유효하지 않은 업로드 경로"), null);
    }
    cb(null, targetPath);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
const upload = multer({ dest: "uploads/" }); // 업로드 폴더를 고정

app.post("/api/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    console.error("❌ 업로드된 파일이 없습니다.");
    return res.status(400).json({ error: "업로드된 파일이 없습니다." });
  }

  const targetPath = path.join(req.body.targetPath, req.file.originalname);
  console.log("📥 요청된 업로드 대상 폴더:", req.body.targetPath);
  console.log("📦 업로드된 파일 임시 경로:", req.file.path);
  console.log("📍 최종 저장될 경로:", targetPath);

  fs.rename(req.file.path, targetPath, (err) => {
    if (err) {
      console.error("❌ 파일 이동 실패:", err.message);
      return res.status(500).json({ error: "파일 저장 실패" });
    }

    console.log("✅ 업로드 완료:", req.file.originalname);
    console.log("📂 저장된 위치:", targetPath);
    res.status(200).json({
      message: "업로드 완료",
      filename: req.file.originalname,
      path: targetPath,
    });
  });
});

// 🚀 서버 실행
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
