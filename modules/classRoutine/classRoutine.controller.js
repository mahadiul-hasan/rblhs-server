const path = require("path");
const fs = require("fs");
const pool = require("../../config/db");
const GenerateUniqueFileName = require("../../utils/GenerateUniqueFileName");

module.exports = {
	createClassRoutine: async (req, res) => {
		if (!req.files) {
			return res.status(404).json({
				message: "File not found",
			});
		}

		const imageFile = req.files.image;
		const imageFileName = await GenerateUniqueFileName(imageFile.name);
		const imagePath = path.join("uploads", "classRoutines", imageFileName);

		imageFile.mv(imagePath, (err) => {
			if (err) {
				return res.status(404).json({
					message: "Error saving image file.",
				});
			}

			// Add the unique file paths to the payload
			req.body.image = imagePath;

			pool.query(
				"SELECT * FROM class_routine WHERE className = ?",
				[req.body.className],
				(error, results) => {
					if (error) {
						return res.status(500).json({
							message:
								"Error checking for existing Class Routine",
							error: error.message,
						});
					}

					if (results.length > 0) {
						// Delete the uploaded image since the class routine already exists
						fs.unlink(imagePath, (err) => {
							if (err) {
								console.error("Error deleting image file", err);
							}
							return res.status(400).json({
								message:
									"Class Routine already exists with the same class name",
							});
						});
					} else {
						// If class routine doesn't exist with the same attributes, proceed to insert
						pool.query(
							"INSERT INTO class_routine SET ?",
							req.body,
							(insertError, insertResults) => {
								if (insertError) {
									return res.status(500).json({
										message: "Error creating Class Routine",
										error: insertError.message,
									});
								}

								return res.status(200).json({
									message:
										"Class Routine created successfully",
									classRoutineId: insertResults.insertId,
								});
							}
						);
					}
				}
			);
		});
	},
	getAllClassRoutines: (req, res) => {
		pool.query(
			"SELECT * FROM class_routine ORDER BY id DESC",
			(error, results) => {
				// Handle any errors
				if (error) {
					return res.status(500).json({
						message: "Error retrieving Class Routines",
						error: error.message,
					});
				}
				return res.status(200).json({
					message: "Class Routines retrieved successfully",
					classRoutines: results,
				});
			}
		);
	},
	getClassRoutine: (req, res) => {
		const className = req.params.className;
		pool.query(
			"SELECT * FROM class_routine WHERE className = ?",
			[className],
			(error, results) => {
				if (error) {
					return res.status(500).json({
						message: "Error getting class routine",
						error: error.message,
					});
				}
				if (results.length === 0) {
					return res.status(404).json({
						message: "Class routine not found",
					});
				}

				return res.status(200).json({
					message: "Class routine retrieved successfully",
					classRoutine: results[0],
				});
			}
		);
	},
	deleteClassRoutine: (req, res) => {
		const id = req.params.id;

		// Retrieve the image path before deleting the ClassRoutine
		pool.query(
			"SELECT image FROM class_routine WHERE id = ?",
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
						message: "Class Routine not found",
					});
				}

				const imagePath = results[0].image;

				// Delete the class_routine and associated image
				pool.query(
					"DELETE FROM class_routine WHERE id = ?",
					[id],
					(error, deleteResults) => {
						if (error) {
							return res.status(500).json({
								message: "Error deleting Class Routine",
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
										"Class Routine deleted successfully",
								});
							});
						} else {
							// ClassRoutine with the provided ID was not found
							return res.status(404).json({
								message: "Class Routine not found",
							});
						}
					}
				);
			}
		);
	},
};
