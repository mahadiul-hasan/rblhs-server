const ENUM_USER_ROLE = require("../../enums/user");
const auth = require("../middleware/auth");
const {
	createClass,
	getAllClasses,
	getClassById,
	updateClass,
	deleteClass,
} = require("./classes.controller");

const router = require("express").Router();

router.get("/", getAllClasses);

router.get("/:id", getClassById);

router.post(
	"/",
	auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.TEACHER),
	createClass
);

router.patch(
	"/:id",
	auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.TEACHER),
	updateClass
);

router.delete(
	"/:id",
	auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.TEACHER),
	deleteClass
);

module.exports = router;
