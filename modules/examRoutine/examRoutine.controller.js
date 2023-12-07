const path = require("path");
const fs = require("fs");
const pool = require("../../config/db");
const GenerateUniqueFileName = require("../../utils/GenerateUniqueFileName");
const NodeCache = require("node-cache");
const cache = new NodeCache();
const util = require("util");
const queryAsync = util.promisify(pool.query).bind(pool);

module.exports = {
	createExamRoutine: async (req, res) => {
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
				"examRoutines",
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
					const existingExamRoutine = await queryAsync(
						"SELECT * FROM exam_routines WHERE className = ? AND examName = ?",
						[req.body.className, req.body.examName]
					);

					if (existingExamRoutine.length > 0) {
						fs.unlink(imagePath, (err) => {
							if (err) {
								console.error(
									"Error deleting exam routine",
									err
								);
							}
						});

						return res.status(400).json({
							message:
								"Exam Routine already exists with the same class and exam name",
						});
					}

					const insertResults = await queryAsync(
						"INSERT INTO exam_routines SET ?",
						req.body
					);

					cache.del("examRoutines");
					cache.del("examRoutine");

					return res.status(200).json({
						message: "Exam Routine created successfully",
						examRoutineId: insertResults.insertId,
					});
				} catch (error) {
					return res.status(500).json({
						message: "Error creating Exam Routine",
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

	getAllExamRoutines: async (req, res) => {
		try {
			const cachedExamRoutines = cache.get("examRoutines");
			if (cachedExamRoutines) {
				return res.status(200).json({
					message: "Exam Routines retrieved from cache",
					examRoutines: cachedExamRoutines.results,
				});
			}

			const results = await queryAsync(
				"SELECT * FROM exam_routines ORDER BY id DESC"
			);

			cache.set("examRoutines", {
				results,
			});

			return res.status(200).json({
				message: "Exam Routines retrieved successfully",
				examRoutines: results,
			});
		} catch (error) {
			return res.status(500).json({
				message: "Error retrieving exam Routines",
				error: error.message,
			});
		}
	},

	deleteExamRoutine: async (req, res) => {
		try {
			const id = req.params.id;

			const results = await queryAsync(
				"SELECT image FROM exam_routines WHERE id = ?",
				[id]
			);

			if (results.length === 0) {
				return res.status(404).json({
					message: "Exam Routine not found",
				});
			}

			const imagePath = results[0].image;

			const deleteResults = await queryAsync(
				"DELETE FROM exam_routines WHERE id = ?",
				[id]
			);

			if (deleteResults.affectedRows === 1) {
				fs.unlink(imagePath, (err) => {
					if (err) {
						console.error("Error deleting exam routine");
					}
				});

				cache.del("examRoutines");
				cache.del("examRoutine");

				return res.status(200).json({
					message: "Exam Routine deleted successfully",
				});
			} else {
				return res.status(404).json({
					message: "Exam Routine not found",
				});
			}
		} catch (error) {
			return res.status(500).json({
				message: "Error deleting Exam Routine",
				error: error.message,
			});
		}
	},
};
