const path = require("path");
const fs = require("fs");
const pool = require("../../config/db");
const GenerateUniqueFileName = require("../../utils/GenerateUniqueFileName");

module.exports = {
	createExamRoutine: async (req, res) => {
		if (!req.files) {
			return res.status(404).json({
				message: "File not found",
			});
		}

		const imageFile = req.files.image;
		const imageFileName = await GenerateUniqueFileName(imageFile.name);
		const imagePath = path.join("uploads", "examRoutines", imageFileName);

		imageFile.mv(imagePath, (err) => {
			if (err) {
				return res.status(404).json({
					message: "Error saving image file.",
				});
			}

			// Add the unique file paths to the payload
			req.body.image = imagePath;

			pool.query(
				"SELECT * FROM exam_routine WHERE className = ? AND examName = ?",
				[req.body.className, req.body.examName],
				(error, results) => {
					if (error) {
						return res.status(500).json({
							message: "Error checking for existing Exam Routine",
							error: error.message,
						});
					}

					if (results.length > 0) {
						// Delete the uploaded image since the exam routine already exists
						fs.unlink(imagePath, (err) => {
							if (err) {
								console.error("Error deleting image file", err);
							}
							return res.status(400).json({
								message:
									"Exam Routine already exists with the same class and exam name",
							});
						});
					} else {
						// If exam routine doesn't exist with the same attributes, proceed to insert
						pool.query(
							"INSERT INTO exam_routine SET ?",
							req.body,
							(insertError, insertResults) => {
								if (insertError) {
									return res.status(500).json({
										message: "Error creating exam Routine",
										error: insertError.message,
									});
								}

								return res.status(200).json({
									message:
										"Exam Routine created successfully",
									examRoutineId: insertResults.insertId,
								});
							}
						);
					}
				}
			);
		});
	},
	getAllExamRoutines: (req, res) => {
		pool.query(
			"SELECT * FROM exam_routine ORDER BY id DESC",
			(error, results) => {
				// Handle any errors
				if (error) {
					return res.status(500).json({
						message: "Error retrieving exam Routines",
						error: error.message,
					});
				}
				return res.status(200).json({
					message: "Exam Routines retrieved successfully",
					examRoutines: results,
				});
			}
		);
	},
	getExamRoutine: (req, res) => {
		pool.query(
			"SELECT * FROM exam_routine WHERE className = ? AND examName = ?",
			[req.body.className, req.body.examName],
			(error, results) => {
				if (error) {
					return res.status(500).json({
						message: "Error getting exam routine",
						error: error.message,
					});
				}
				if (results.length === 0) {
					return res.status(404).json({
						message: "Exam routine not found",
					});
				}

				return res.status(200).json({
					message: "Exam routine retrieved successfully",
					examRoutine: results[0],
				});
			}
		);
	},
	deleteExamRoutine: (req, res) => {
		const id = req.params.id;

		// Retrieve the image path before deleting the ExamRoutine
		pool.query(
			"SELECT image FROM exam_routine WHERE id = ?",
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
						message: "Exam Routine not found",
					});
				}

				const imagePath = results[0].image;

				// Delete the exam_routine and associated image
				pool.query(
					"DELETE FROM exam_routine WHERE id = ?",
					[id],
					(error, deleteResults) => {
						if (error) {
							return res.status(500).json({
								message: "Error deleting Exam Routine",
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
									message:
										"Exam Routine deleted successfully",
								});
							});
						} else {
							// ExamRoutine with the provided ID was not found
							return res.status(404).json({
								message: "Exam Routine not found",
							});
						}
					}
				);
			}
		);
	},
};
