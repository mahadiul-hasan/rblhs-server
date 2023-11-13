const {
	getAllBanners,
	deleteBanner,
	createBanner,
} = require("./banner.controller");
const ENUM_USER_ROLE = require("../../enums/user");
const auth = require("../middleware/auth");

const router = require("express").Router();

router.get("/", getAllBanners);

router.post(
	"/",
	auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.TEACHER),
	createBanner
);

router.delete(
	"/:id",
	auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.TEACHER),
	deleteBanner
);

module.exports = router;
