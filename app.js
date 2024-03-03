const express = require("express");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const dotenv = require("dotenv");
const path = require("path");
const multer = require("multer");
const fs = require("fs");

dotenv.config();
const indexRouter = require("./routes");
const userRouter = require("./routes/user");
const app = express();
app.set("port", process.env.PORT || 3000);

app.use(morgan("dev")); //요청과 응답에 대한 정보 기록
// http메서드, 주소, http상태코드, 응답속도, - 응답바이트
app.use("/", express.static(path.join(__dirname, "public"))); //정적파일 라우팅 설정
app.use(express.json()); // 요쳥한 데이터가 json형식일때 자바스크립트 형식으로 바꿈
app.use(express.urlencoded({ extended: false })); // get 요청시 쿼리스트링의 데이터를 자바스크립트 형식으로 자동으로 파싱하여 body에 담음
// false이면 querystring (내부모듈사용), true이면 qs(라이브러리 사용)
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(
  session({
    reasve: false,
    saveUninitialized: false,
    secret: process.env.COOKIE_SECRET,
    cookie: {
      httpOnly: true,
      secure: false,
    },
    name: "session-cookie",
  })
);

try {
  fs.readdirSync("uploads");
} catch (error) {
  console.error("upload 폴더가 없어 uploads 폴더를 생성합니다. ");
  fs.mkdirSync("uploads");
}
const upload = multer({
  storage: multer.diskStorage({
    destination(req, file, done) {
      done(null, "uploads/");
    },
    filename(req, file, done) {
      const ext = path.extname(file.originalname);
      done(null, path.basename(file.originalname, ext) + Date.now() + ext);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
});

app.get("/upload", (req, res) => {
  res.sendFile(path.join(__dirname, "multipart.html"));
});

app.post("/upload", upload.array("claim"), (req, res) => {
  console.log(req.files, req.body);
  res.send("ok");
});

app.use("/", indexRouter);
app.use("/user", userRouter);

app.use((req, res, next) => {
  res.status(404).send("Not Found");
});

// app.use((req,res, next)=> {
//   console.log('모든 요청에 다 실행됩니다. ');
//   next();
// })
// app.get('/', (req, res, next) => {
//   console.log('GET / 요청에서만 실행됩니다.');
//   next();
// }, (req, res) => {
//   throw new Error('에러는 에러처리 미들웨어로 갑니다. ')
// });

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send(err.message);
});
app.listen(app.get("port"), () => {
  console.log(app.get("port"), "번 포트에서 대기 중");
});
