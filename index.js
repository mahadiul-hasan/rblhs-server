require("dotenv").config();
const express = require("express");
const fileUpload = require("express-fileupload");
const cors = require("cors");
const UserRouter = require("./modules/user/user.route");
const AuthRouter = require("./modules/auth/auth.route");
const BannerRouter = require("./modules/banner/banner.route");
const NoticeRouter = require("./modules/notice/notice.route");
const ClassRoutineRouter = require("./modules/classRoutine/classRoutine.route");
const ExamRoutineRouter = require("./modules/examRoutine/examRoutine.route");
const ResultRouter = require("./modules/result/result.route");

const app = express();

app.use(express.json());
app.use(cors());
app.use(fileUpload());

app.use("/api/users", UserRouter);
app.use("/api/auth", AuthRouter);
app.use("/api/banners", BannerRouter);
app.use("/api/notices", NoticeRouter);
app.use("/api/class-routines", ClassRoutineRouter);
app.use("/api/exam-routines", ExamRoutineRouter);
app.use("/api/results", ResultRouter);

app.listen();
