const ENUM_USER_ROLE = require("../../enums/user");
const auth = require("../middleware/auth");
const { login, changePassword, resetPassword } = require("./auth.controller");

const router = require("express").Router();

router.post("/login", login);

router.patch(
	"/change-password",
	auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.TEACHER),
	changePassword
);

router.patch("/reset-password", auth(ENUM_USER_ROLE.ADMIN), resetPassword);

module.exports = router;
