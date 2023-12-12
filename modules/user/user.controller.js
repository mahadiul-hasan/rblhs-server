const path = require("path");
const fs = require("fs");
const util = require("util");
const pool = require("../../config/db");
const GenerateUniqueFileName = require("../../utils/GenerateUniqueFileName");
const NodeCache = require("node-cache");
const cache = new NodeCache();
const queryAsync = util.promisify(pool.query).bind(pool);

module.exports = {
	createUser: async (req, res) => {
		try {
			if (!req.files || !req.files.image) {
				return res.status(404).json({
					message: "File not found",
				});
			}

			const imageFile = req.files.image;
			const imageFileName = await GenerateUniqueFileName(imageFile.name);
			const imagePath = path.join("uploads", "teachers", imageFileName);

			imageFile.mv(imagePath, async (err) => {
				if (err) {
					return res.status(500).json({
						message: "Error saving image file.",
						error: err.message,
					});
				}

				// Add the unique file paths to the payload
				req.body.profileImage = imagePath;

				const existingUser = await queryAsync(
					"SELECT * FROM users WHERE phone = ?",
					[req.body.phone]
				);

				if (existingUser.length > 0) {
					return res.status(400).json({
						message: "Phone number already exists",
					});
				} else {
					const insertResults = await queryAsync(
						"INSERT INTO users SET ?",
						req.body
					);

					cache.del("allUsers");

					return res.status(200).json({
						message: "User created successfully",
						userId: insertResults.insertId,
					});
				}
			});
		} catch (error) {
			if (req.body.profileImage) {
				fs.unlink(req.body.profileImage, (err) => {
					if (err) {
						return res.status(500).json({
							message: "Something went wrong. Please try again",
						});
					}
				});
			}

			return res.status(500).json({
				message: "Server error. Please try again later",
				error: error.message,
			});
		}
	},

	getAllUsers: async (req, res) => {
		try {
			const cachedUsers = cache.get("allUsers");
			if (cachedUsers) {
				return res.status(200).json({
					message: "Users retrieved from cache",
					total: cachedUsers.total,
					users: cachedUsers.results,
				});
			}

			const countResults = await queryAsync(
				"SELECT COUNT(*) AS total FROM users"
			);

			const total = countResults[0].total;

			const results = await queryAsync(
				"SELECT id, name, phone, education, designation, achievement, joinDate, profileImage, role FROM users ORDER BY id DESC"
			);

			cache.set("allUsers", {
				total,
				results,
			});

			return res.status(200).json({
				message: "Users retrieved successfully",
				total,
				users: results,
			});
		} catch (error) {
			return res.status(500).json({
				message: "Server error. Please try again later",
				error: error.message,
			});
		}
	},

	userProfile: async (req, res) => {
		try {
			const { id } = req.user;
			const results = await queryAsync(
				"SELECT id, name, phone, education, designation, achievement, joinDate, profileImage FROM users WHERE id = ?",
				[id]
			);

			if (results.length === 0) {
				return res.status(404).json({
					message: "User not found",
				});
			}

			const profile = results[0];

			return res.status(200).json({
				message: "User retrieved successfully",
				user: profile,
			});
		} catch (error) {
			return res.status(500).json({
				message: "Server error. Please try again later",
				error: error.message,
			});
		}
	},

	getUserById: async (req, res) => {
		try {
			const id = req.params.id;
			const results = await queryAsync(
				"SELECT id, name, phone, education, designation, achievement, joinDate, profileImage FROM users WHERE id = ?",
				[id]
			);

			if (results.length === 0) {
				return res.status(404).json({
					message: "User not found",
				});
			}

			const userData = results[0];

			return res.status(200).json({
				message: "User retrieved successfully",
				user: userData,
			});
		} catch (error) {
			return res.status(500).json({
				message: "Server error. Please try again later",
				error: error.message,
			});
		}
	},

	updateUser: async (req, res) => {
		try {
			const { id } = req.user;
			const { phone } = req.body;

			if (phone) {
				const user = await queryAsync(
					"SELECT * FROM users WHERE phone = ? AND id != ?",
					[phone, id]
				);

				if (user.length > 0) {
					return res.status(400).json({
						message:
							"Phone number already exists. Profile update not allowed.",
					});
				}
			}

			const updateUserQuery = await queryAsync(
				"UPDATE users SET ? WHERE id = ?",
				[req.body, id]
			);

			if (updateUserQuery.affectedRows === 0) {
				return res.status(404).json({
					message: "User not found",
				});
			}

			cache.del("allUsers");

			return res.status(200).json({
				message: "User updated successfully",
			});
		} catch (error) {
			return res.status(500).json({
				message: "Error updating user",
				error: error.message,
			});
		}
	},

	deleteUser: async (req, res) => {
		try {
			const id = req.params.id;
			const results = await queryAsync(
				"SELECT profileImage FROM users WHERE id = ?",
				[id]
			);

			if (results.length === 0) {
				return res.status(404).json({
					message: "User image not found",
				});
			}

			const imagePath = results[0].profileImage;

			const deleteResults = await queryAsync(
				"DELETE FROM users WHERE id = ?",
				[id]
			);

			if (deleteResults.affectedRows === 1) {
				fs.unlink(`${imagePath}`, (err) => {
					if (err) {
						return res.status(500).json({
							message: "Error deleting image file",
							error: err.message,
						});
					}

					cache.del("allUsers");

					return res.status(200).json({
						message: "User deleted successfully",
					});
				});
			} else {
				return res.status(404).json({
					message: "User not found",
				});
			}
		} catch (error) {
			return res.status(500).json({
				message: "Server error. Please try again later",
				error: error.message,
			});
		}
	},

	updateProfileImage: async (req, res) => {
		try {
			const { id } = req.user;

			if (!req.files || !req.files.image) {
				return res.status(404).json({
					message: "File not found",
				});
			}

			const imageFile = req.files.image;
			const imageFileName = await GenerateUniqueFileName(imageFile.name);
			const imagePath = path.join("uploads", "teachers", imageFileName);

			imageFile.mv(imagePath, async (err) => {
				if (err) {
					return res.status(500).json({
						message: "Error saving image file.",
						error: err.message,
					});
				}

				req.body.profileImage = imagePath;

				const results = await queryAsync(
					"SELECT * FROM users WHERE id = ?",
					[id]
				);

				if (results.length === 0) {
					return res.status(400).json({
						message: "User Not Found",
					});
				}

				const existingImagePath = results[0].profileImage;

				const updateResult = await queryAsync(
					"UPDATE users SET profileImage = ? WHERE id = ?",
					[req.body.profileImage, id]
				);

				if (updateResult.affectedRows === 0) {
					return res.status(404).json({
						message: "User not found",
					});
				} else {
					fs.unlink(existingImagePath, (err) => {
						if (err) {
							console.error("Error deleting profile image:", err);
						}
					});

					cache.del("allUsers");

					return res.status(200).json({
						message: "User Profile Image updated successfully",
					});
				}
			});
		} catch (error) {
			fs.unlink(req.body.profileImage, (err) => {
				if (err) {
					return res.status(500).json({
						message: "Something went wrong. Please try again",
					});
				}
			});
			return res.status(500).json({
				message: "Server error. Please try again later",
				error: error.message,
			});
		}
	},
};
