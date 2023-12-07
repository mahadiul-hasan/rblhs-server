const path = require("path");
const fs = require("fs");
const pool = require("../../config/db");
const GenerateUniqueFileName = require("../../utils/GenerateUniqueFileName");
const NodeCache = require("node-cache");
const cache = new NodeCache();
const util = require("util");
const queryAsync = util.promisify(pool.query).bind(pool);

module.exports = {
	createClassRoutine: async (req, res) => {
		try {
			if (!req.files || !req.files.image) {
				return res.status(404).json({
					message: "File not found",
				});
			}

			const imageFile = req.files.image;
			const imageFileName = await GenerateUniqueFileName(imageFile.name);
			const imagePath = path.join(
				"uploads",
				"classRoutines",
				imageFileName
			);

			imageFile.mv(imagePath, async (err) => {
				if (err) {
					return res.status(500).json({
						message: "Error saving image file.",
						error: err.message,
					});
				}

				// Add the unique file paths to the payload
				req.body.image = imagePath;

				try {
					const existingClassRoutine = await queryAsync(
						"SELECT * FROM class_routines WHERE className = ?",
						[req.body.className]
					);

					if (existingClassRoutine.length > 0) {
						fs.unlink(imagePath, (err) => {
							if (err) {
								console.error("Error deleting class routine");
							}
						});
						return res.status(400).json({
							message:
								"Class Routine already exists with the same class name",
						});
					}

					const insertResults = await queryAsync(
						"INSERT INTO class_routines SET ?",
						req.body
					);

					cache.del("classRoutines");
					cache.del("classRoutine");

					return res.status(200).json({
						message: "Class Routine created successfully",
						classRoutineId: insertResults.insertId,
					});
				} catch (error) {
					return res.status(500).json({
						message: "Error creating Class Routine",
						error: error.message,
					});
				}
			});
		} catch (error) {
			if (req.body.image) {
				fs.unlink(req.body.image, (err) => {
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

	getAllClassRoutines: async (req, res) => {
		try {
			const cachedClassRoutines = cache.get("classRoutines");
			if (cachedClassRoutines) {
				return res.status(200).json({
					message: "Class Routines retrieved from cache",
					classRoutines: cachedClassRoutines.results,
				});
			}

			const results = await queryAsync(
				"SELECT * FROM class_routines ORDER BY id DESC"
			);

			cache.set("classRoutines", {
				results,
			});

			return res.status(200).json({
				message: "Class Routines retrieved successfully",
				classRoutines: results,
			});
		} catch (error) {
			return res.status(500).json({
				message: "Error retrieving Class Routines",
				error: error.message,
			});
		}
	},

	getClassRoutine: async (req, res) => {
		try {
			const className = req.params.className;
			const cachedClassRoutine = cache.get("classRoutine");

			if (cachedClassRoutine && cachedClassRoutine[className]) {
				return res.status(200).json({
					message: "Class Routine retrieved from cache",
					classRoutine: cachedClassRoutine[className].results,
				});
			}

			const routines = await queryAsync(
				"SELECT * FROM class_routines WHERE className = ?",
				[className]
			);

			if (routines.length === 0) {
				return res.status(404).json({
					message: "Class routine not found",
				});
			}

			const results = routines[0];

			// Check if className is in the range of six to ten, then cache the result
			const classesToCache = ["Six", "Seven", "Eight", "Nine", "Ten"];
			if (classesToCache.includes(className)) {
				if (!cachedClassRoutine) {
					cache.set("classRoutine", {
						[className]: { results },
					});
				} else {
					cachedClassRoutine[className] = { results };
					cache.set("classRoutine", cachedClassRoutine);
				}
			}

			return res.status(200).json({
				message: "Class routine retrieved successfully",
				classRoutine: results,
			});
		} catch (error) {
			return res.status(500).json({
				message: "Error getting class routine",
				error: error.message,
			});
		}
	},

	deleteClassRoutine: async (req, res) => {
		try {
			const id = req.params.id;
			const results = await queryAsync(
				"SELECT image FROM class_routines WHERE id = ?",
				[id]
			);

			if (results.length === 0) {
				return res.status(404).json({
					message: "Class Routine not found",
				});
			}

			const imagePath = results[0].image;
			const deleteResults = await queryAsync(
				"DELETE FROM class_routines WHERE id = ?",
				[id]
			);

			if (deleteResults.affectedRows === 1) {
				fs.unlink(imagePath, (err) => {
					if (err) {
						console.error("Error deleting class routine");
					}
				});

				cache.del("classRoutines");
				cache.del("classRoutine");

				return res.status(200).json({
					message: "Class Routine deleted successfully",
				});
			} else {
				return res.status(404).json({
					message: "Class Routine not found",
				});
			}
		} catch (error) {
			return res.status(500).json({
				message: "Error deleting Class Routine",
				error: error.message,
			});
		}
	},
};
