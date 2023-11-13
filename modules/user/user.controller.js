const path = require("path");
const fs = require("fs");
const pool = require("../../config/db");
const GenerateUniqueFileName = require("../../utils/GenerateUniqueFileName");
const CheckPhoneExists = require("../../utils/CheckPhoneExist");

module.exports = {
	createUser: async (req, res) => {
		if (!req.files) {
			return res.status(404).json({
				message: "File not found",
			});
		}

		const imageFile = req.files.image;
		const imageFileName = await GenerateUniqueFileName(imageFile.name);
		const imagePath = path.join("uploads", "teachers", imageFileName);

		imageFile.mv(imagePath, (err) => {
			if (err) {
				return res.status(404).json({
					message: "Error saving image file.",
				});
			}

			// Add the unique file paths to the payload
			req.body.profileImage = imagePath;

			pool.query(
				"SELECT * FROM user WHERE phone = ?",
				[req.body.phone],
				(error, results) => {
					if (error) {
						return res.status(500).json({
							message: "Error checking for existing user",
							error: error.message,
						});
					}

					if (results.length > 0) {
						return res.status(400).json({
							message: "Phone number already exists",
						});
					} else {
						pool.query(
							"INSERT INTO user SET ?",
							req.body,
							(insertError, insertResults) => {
								if (insertError) {
									return res.status(500).json({
										message: "Error creating user",
										error: insertError.message,
									});
								}

								return res.status(200).json({
									message: "User created successfully",
									userId: insertResults.insertId,
								});
							}
						);
					}
				}
			);
		});
	},
	getAllUsers: (req, res) => {
		pool.query(
			"SELECT COUNT(*) AS total FROM user",
			(countError, countResults) => {
				if (countError) {
					return res.status(500).json({
						message: "Error retrieving user count",
						error: countError.message,
					});
				}

				const total = countResults[0].total;

				// Retrieve all users
				pool.query(
					"SELECT id, name, phone, education, designation, achievement, joinDate, profileImage, role FROM user ORDER BY id DESC",
					(error, results) => {
						if (error) {
							return res.status(500).json({
								message: "Error retrieving users",
								error: error.message,
							});
						}

						return res.status(200).json({
							message: "Users retrieved successfully",
							total: total,
							users: results,
						});
					}
				);
			}
		);
	},
	userProfile: (req, res) => {
		const { id } = req.user;
		pool.query(
			"SELECT id, name, phone, education, designation, achievement, joinDate, profileImage FROM user WHERE id = ?",
			[id],
			(error, results) => {
				if (error) {
					return res.status(500).json({
						message: "Error getting user",
						error: error.message,
					});
				}
				if (results.length === 0) {
					return res.status(404).json({
						message: "User not found",
					});
				}

				return res.status(200).json({
					message: "User retrieved successfully",
					user: results[0],
				});
			}
		);
	},
	getUserById: (req, res) => {
		const id = req.params.id;
		pool.query(
			"SELECT id, name, phone, education, designation, achievement, joinDate, profileImage FROM user WHERE id = ?",
			[id],
			(error, results) => {
				if (error) {
					return res.status(500).json({
						message: "Error getting user",
						error: error.message,
					});
				}
				if (results.length === 0) {
					return res.status(404).json({
						message: "User not found",
					});
				}

				return res.status(200).json({
					message: "User retrieved successfully",
					user: results[0],
				});
			}
		);
	},
	updateUser: async (req, res) => {
		const { id } = req.user;
		const { phone } = req.body;

		if (phone) {
			// Check if the phone already exists in the database
			const phoneExists = await CheckPhoneExists(phone);
			if (phoneExists) {
				return res.status(400).json({
					message:
						"Phone number already exists. Profile update not allowed.",
				});
			}
		}

		pool.query(
			"UPDATE user SET ? WHERE id = ?",
			[req.body, id],
			(error, results) => {
				if (error) {
					return res.status(500).json({
						message: "Error updating user",
						error: error.message,
					});
				}

				if (results.affectedRows === 0) {
					return res.status(404).json({
						message: "User not found",
					});
				}

				return res.status(200).json({
					message: "User updated successfully",
				});
			}
		);
	},
	deleteUser: (req, res) => {
		const id = req.params.id;

		pool.query(
			"SELECT profileImage FROM user WHERE id = ?",
			[id],
			(error, results) => {
				if (error) {
					return res.status(500).json({
						message: "Error getting image path",
						error: error.message,
					});
				}

				if (results.length === 0) {
					return res.status(404).json({
						message: "User image not found",
					});
				}

				const imagePath = results[0].profileImage;

				pool.query(
					"DELETE FROM user WHERE id = ?",
					[id],
					(error, deleteResults) => {
						if (error) {
							return res.status(500).json({
								message: "Error deleting User",
								error: error.message,
							});
						}

						if (deleteResults.affectedRows === 1) {
							// Delete the associated image file
							fs.unlink(`${imagePath}`, (err) => {
								if (err) {
									return res.status(500).json({
										message: "Error deleting image file",
										error: err.message,
									});
								}

								return res.status(200).json({
									message: "User deleted successfully",
								});
							});
						} else {
							return res.status(404).json({
								message: "User not found",
							});
						}
					}
				);
			}
		);
	},
	updateProfileImage: async (req, res) => {
		const { id } = req.user;

		if (!req.files) {
			return res.status(404).json({
				message: "File not found",
			});
		}

		const imageFile = req.files.image;
		const imageFileName = await GenerateUniqueFileName(imageFile.name);
		const imagePath = path.join("uploads", "teachers", imageFileName);

		imageFile.mv(imagePath, (err) => {
			if (err) {
				return res.status(404).json({
					message: "Error saving image file.",
				});
			}

			req.body.profileImage = imagePath;

			pool.query(
				"SELECT * FROM user WHERE id = ?",
				[id],
				(error, results) => {
					if (error) {
						return res.status(500).json({
							message: "Error checking for existing user",
							error: error.message,
						});
					}

					if (results.length < 0) {
						return res.status(400).json({
							message: "User Not Found",
						});
					}

					const imagePath = results[0].profileImage;

					pool.query(
						"UPDATE user SET profileImage = ? WHERE id = ?",
						[req.body.profileImage, id],
						(error, results) => {
							if (error) {
								return res.status(500).json({
									message:
										"Server error. Please try again later",
								});
							}

							if (results.affectedRows === 0) {
								return res.status(404).json({
									message: "User not found",
								});
							} else {
								fs.unlinkSync(imagePath);
								return res.status(200).json({
									message:
										"User Profile Image updated successfully",
								});
							}
						}
					);
				}
			);
		});
	},
};
