const {
	getAllClassRoutines,
	getClassRoutine,
	createClassRoutine,
	deleteClassRoutine,
} = require("./classRoutine.controller");
const ENUM_USER_ROLE = require("../../enums/user");
const auth = require("../middleware/auth");

const router = require("express").Router();

router.get("/", getAllClassRoutines);
router.get("/:className", getClassRoutine);

router.post(
	"/",
	auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.TEACHER),
	createClassRoutine
);

router.delete(
	"/:id",
	auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.TEACHER),
	deleteClassRoutine
);

module.exports = router;
