const ENUM_USER_ROLE = require("../../enums/user");
const auth = require("../middleware/auth");
const {
	deleteSSCResult,
	getAllSSCResults,
	createSSCResult,
} = require("./ssc.controller");

const router = require("express").Router();

router.get("/", getAllSSCResults);

router.post(
	"/",
	auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.TEACHER),
	createSSCResult
);

router.delete(
	"/:id",
	auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.TEACHER),
	deleteSSCResult
);

module.exports = router;
