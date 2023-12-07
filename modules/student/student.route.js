const ENUM_USER_ROLE = require("../../enums/user");
const auth = require("../middleware/auth");
const {
	getAllStudents,
	createStudent,
	updateStudent,
	deleteStudent,
	getStudentByClass,
} = require("./student.controller");

const router = require("express").Router();

router.get("/", getAllStudents);

router.get("/:class_name", getStudentByClass);

router.post(
	"/",
	auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.TEACHER),
	createStudent
);

router.patch(
	"/:id",
	auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.TEACHER),
	updateStudent
);

router.delete(
	"/:id",
	auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.TEACHER),
	deleteStudent
);

module.exports = router;
