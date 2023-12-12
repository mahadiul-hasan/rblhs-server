const ENUM_USER_ROLE = require("../../enums/user");
const auth = require("../middleware/auth");
const {
	getAllStudents,
	createStudent,
	updateStudent,
	deleteStudent,
	getStudentByClass,
	deleteStudentsByClassAndYear,
	getOneStudent,
} = require("./student.controller");

const router = require("express").Router();

router.get("/", getAllStudents);

router.get("/:className", getStudentByClass);

router.post(
	"/",
	auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.TEACHER),
	createStudent
);

router.post(
	"/one",
	auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.TEACHER),
	getOneStudent
);

router.post(
	"/all",
	auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.TEACHER),
	deleteStudentsByClassAndYear
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
