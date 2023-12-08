const ENUM_USER_ROLE = require("../../enums/user");
const auth = require("../middleware/auth");
const {
	createAndGetPaymentData,
	getAllPayments,
	deletePayment,
} = require("./payment.controller");

const router = require("express").Router();

router.get(
	"/",
	auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.TEACHER),
	getAllPayments
);

router.post(
	"/",
	auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.TEACHER),
	createAndGetPaymentData
);

router.delete(
	"/:id",
	auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.TEACHER),
	deletePayment
);

module.exports = router;
