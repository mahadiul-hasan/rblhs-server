const jwt = require("jsonwebtoken");

const auth =
	(...requiredRoles) =>
	async (req, res, next) => {
		try {
			// get authorization token
			const token = req.headers.authorization;
			if (!token) {
				return res
					.status(404)
					.json({ message: "You are not authorized" });
			}

			const verifiedUser = await jwt.verify(
				token,
				process.env.JWT_SECRET
			);

			req.user = verifiedUser;

			// role guard
			if (
				requiredRoles.length &&
				!requiredRoles.includes(verifiedUser.role)
			) {
				return res.status(403).json({ message: "Forbidden" });
			}

			next();
		} catch (error) {
			next(error);
		}
	};

module.exports = auth;
