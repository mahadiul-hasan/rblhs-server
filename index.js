require("dotenv").config();
const express = require("express");
const path = require("path");
const fileUpload = require("express-fileupload");
const cors = require("cors");
const UserRouter = require("./modules/user/user.route");
const AuthRouter = require("./modules/auth/auth.route");
const BannerRouter = require("./modules/banner/banner.route");
const NoticeRouter = require("./modules/notice/notice.route");
const ClassRoutineRouter = require("./modules/classRoutine/classRoutine.route");
const ExamRoutineRouter = require("./modules/examRoutine/examRoutine.route");
const OldResultRouter = require("./modules/oldResult/oldResult.route");
const NewResultRouter = require("./modules/newResult/newResult.route");
const StudentRouter = require("./modules/student/student.route");
const ClassRouter = require("./modules/classes/classes.route");
const SSCRouter = require("./modules/ssc/ssc.route");
const PaymentRouter = require("./modules/payment/payment.route");

const app = express();

app.use(express.json());
app.use(cors());
app.use(fileUpload());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/users", UserRouter);
app.use("/api/auth", AuthRouter);
app.use("/api/banners", BannerRouter);
app.use("/api/notices", NoticeRouter);
app.use("/api/class-routines", ClassRoutineRouter);
app.use("/api/exam-routines", ExamRoutineRouter);
app.use("/api/old-results", OldResultRouter);
app.use("/api/new-results", NewResultRouter);
app.use("/api/students", StudentRouter);
app.use("/api/classes", ClassRouter);
app.use("/api/ssc", SSCRouter);
app.use("/api/payments", PaymentRouter);

app.listen(process.env.PORT, () => {
	console.log(`Server is running on port ${process.env.PORT}`);
});
