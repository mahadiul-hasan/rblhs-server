const {
	createNotice,
	getNoticeById,
	getAllNotices,
	updateNotice,
	deleteNotice,
} = require("./notice.controller");
const ENUM_USER_ROLE = require("../../enums/user");
const auth = require("../middleware/auth");

const router = require("express").Router();

router.get("/", getAllNotices);

router.get("/:id", getNoticeById);

router.post(
	"/",
	auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.TEACHER),
	createNotice
);

router.patch(
	"/:id",
	auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.TEACHER),
	updateNotice
);
router.delete(
	"/:id",
	auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.TEACHER),
	deleteNotice
);

module.exports = router;
