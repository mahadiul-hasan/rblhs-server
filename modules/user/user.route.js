const ENUM_USER_ROLE = require("../../enums/user");
const auth = require("../middleware/auth");
const {
	createUser,
	getAllUsers,
	getUserById,
	updateUser,
	deleteUser,
	updateProfileImage,
	userProfile,
} = require("./user.controller");

const router = require("express").Router();

router.get("/", getAllUsers);

router.get(
	"/profile",
	auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.TEACHER),
	userProfile
);

router.get("/:id", getUserById);

router.post("/", auth(ENUM_USER_ROLE.ADMIN), createUser);

router.patch(
	"/",
	auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.TEACHER),
	updateUser
);

router.patch(
	"/profileImage",
	auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.TEACHER),
	updateProfileImage
);

router.delete("/:id", auth(ENUM_USER_ROLE.ADMIN), deleteUser);

module.exports = router;
