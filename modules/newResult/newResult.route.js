const ENUM_USER_ROLE = require("../../enums/user");
const auth = require("../middleware/auth");
const {
	getAllNewResults,
	getNewResultById,
	getNewResultByRoll,
	createNewResult,
	updateNewResult,
	deleteNewResult,
} = require("./newResult.controller");

const router = require("express").Router();

router.get(
	"/",
	auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.TEACHER),
	getAllNewResults
);

router.get(
	"/:id",
	auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.TEACHER),
	getNewResultById
);

router.post("/one", getNewResultByRoll);

router.post(
	"/",
	auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.TEACHER),
	createNewResult
);

router.patch(
	"/:id",
	auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.TEACHER),
	updateNewResult
);
router.delete(
	"/:id",
	auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.TEACHER),
	deleteNewResult
);

module.exports = router;
