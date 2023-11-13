const pool = require("../../config/db");
const jwt = require("jsonwebtoken");

module.exports = {
	login: (req, res) => {
		pool.query(
			"SELECT * FROM user WHERE phone = ?",
			[req.body.phone],
			async (error, results) => {
				if (error) {
					return res.status(500).json({
						message: "Error checking for existing user",
						error: error.message,
					});
				}
				const existingUser = results[0];

				if (!existingUser) {
					return res.status(400).json({
						message: "User not exist",
					});
				}

				const isPasswordMatch =
					existingUser.password === req.body.password;

				if (!isPasswordMatch) {
					return res.status(404).json({
						message: "Password does not match",
					});
				}

				const { id, phone, role } = existingUser;

				const token = await jwt.sign(
					{
						id,
						phone,
						role,
					},
					process.env.JWT_SECRET,
					{
						expiresIn: process.env.EXPIRES_IN,
					}
				);

				if (token) {
					return res.status(200).json({
						message: "User logged in successfully",
						token: token,
					});
				}
			}
		);
	},
	changePassword: async (req, res) => {
		const user = req.user;
		const { oldPassword, newPassword } = req.body;

		pool.query(
			"SELECT * FROM user WHERE phone = ?",
			[user.phone],
			async (error, results) => {
				if (error) {
					return res
						.status(500)
						.json({ message: "Error checking for existing user" });
				}

				const result = results[0];

				const isPasswordMatch = result.password === oldPassword;

				if (!isPasswordMatch) {
					return res
						.status(404)
						.json({ message: "Old Password is not correct" });
				}

				pool.query(
					"UPDATE user SET password = ? WHERE phone = ?",
					[newPassword, user.phone],
					(error, results) => {
						if (error) {
							return res.status(500).json({
								message: "Error updating password",
								error: error.message,
							});
						}

						if (results.affectedRows === 0) {
							return res.status(404).json({
								message: "User not found",
							});
						}

						return res.status(200).json({
							message: "Password changed successfully",
						});
					}
				);
			}
		);
	},
	resetPassword: async (req, res) => {
		const { phone, password } = req.body;

		pool.query(
			"SELECT * FROM user WHERE phone = ?",
			[phone],
			async (error, results) => {
				if (error) {
					return res
						.status(500)
						.json({ message: "Error checking for existing user" });
				}
				const result = results[0];

				if (result.length < 0) {
					return res.status(404).json({
						message: "User not found",
					});
				}

				pool.query(
					"UPDATE user SET password = ? WHERE phone = ?",
					[password, phone],
					(error, results) => {
						if (error) {
							return res.status(500).json({
								message: "Error updating password",
								error: error.message,
							});
						}

						if (results.affectedRows === 0) {
							return res.status(404).json({
								message: "User not found",
							});
						}

						return res.status(200).json({
							message: "Password Reset successfully",
						});
					}
				);
			}
		);
	},
};
