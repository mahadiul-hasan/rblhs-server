const pool = require("../../config/db");
const jwt = require("jsonwebtoken");
const { promisify } = require("util");

const query = promisify(pool.query).bind(pool);

module.exports = {
	login: async (req, res) => {
		try {
			const results = await query("SELECT * FROM users WHERE phone = ?", [
				req.body.phone,
			]);
			const existingUser = results[0];

			if (!existingUser) {
				return res.status(400).json({
					message: "User does not exist",
				});
			}

			const isPasswordMatch = existingUser.password === req.body.password;

			if (!isPasswordMatch) {
				return res.status(404).json({
					message: "Password does not match",
				});
			}

			const { id, phone, role } = existingUser;

			const token = jwt.sign(
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

			return res.status(200).json({
				message: "User logged in successfully",
				token: token,
			});
		} catch (error) {
			return res.status(500).json({
				message: "Error checking for existing user",
				error: error.message,
			});
		}
	},

	changePassword: async (req, res) => {
		try {
			const user = req.user;
			const { oldPassword, newPassword } = req.body;

			const results = await query("SELECT * FROM users WHERE phone = ?", [
				user.phone,
			]);
			const existingUser = results[0];

			if (!existingUser || existingUser.password !== oldPassword) {
				return res
					.status(404)
					.json({ message: "Old Password is not correct" });
			}

			await query("UPDATE users SET password = ? WHERE phone = ?", [
				newPassword,
				user.phone,
			]);

			return res.status(200).json({
				message: "Password changed successfully",
			});
		} catch (error) {
			return res.status(500).json({
				message: "Error updating password",
				error: error.message,
			});
		}
	},

	resetPassword: async (req, res) => {
		try {
			const { phone, password } = req.body;

			const results = await query("SELECT * FROM users WHERE phone = ?", [
				phone,
			]);
			const existingUser = results[0];

			if (!existingUser) {
				return res.status(404).json({
					message: "User not found",
				});
			}

			await query("UPDATE users SET password = ? WHERE phone = ?", [
				password,
				phone,
			]);

			return res.status(200).json({
				message: "Password Reset successfully",
			});
		} catch (error) {
			return res.status(500).json({
				message: "Error updating password",
				error: error.message,
			});
		}
	},
};
