const {
	getAllExamRoutines,
	createExamRoutine,
	deleteExamRoutine,
} = require("./examRoutine.controller");
const ENUM_USER_ROLE = require("../../enums/user");
const auth = require("../middleware/auth");

const router = require("express").Router();

router.get("/", getAllExamRoutines);

router.post(
	"/",
	auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.TEACHER),
	createExamRoutine
);

router.delete(
	"/:id",
	auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.TEACHER),
	deleteExamRoutine
);

module.exports = router;
