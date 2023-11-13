const {
	createResult,
	getAllResults,
	getResultByRoll,
	updateResult,
	deleteResult,
	getResultById,
} = require("./result.controller");
const ENUM_USER_ROLE = require("../../enums/user");
const auth = require("../middleware/auth");

const router = require("express").Router();

router.get(
	"/",
	auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.TEACHER),
	getAllResults
);

router.get(
	"/:id",
	auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.TEACHER),
	getResultById
);

router.post("/one", getResultByRoll);

router.post(
	"/",
	auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.TEACHER),
	createResult
);

router.patch(
	"/:id",
	auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.TEACHER),
	updateResult
);
router.delete(
	"/:id",
	auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.TEACHER),
	deleteResult
);

module.exports = router;
