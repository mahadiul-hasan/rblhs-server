const path = require("path");
const fs = require("fs");
const pool = require("../../config/db");
const GenerateUniqueFileName = require("../../utils/GenerateUniqueFileName");

module.exports = {
	createBanner: async (req, res) => {
		if (!req.files) {
			return res.status(404).json({
				message: "File not found",
			});
		}
		const imageFile = req.files.image;
		const imageFileName = await GenerateUniqueFileName(imageFile.name);
		const imagePath = path.join("uploads", "banners", imageFileName);

		imageFile.mv(imagePath, (err) => {
			if (err) {
				return res.status(404).json({
					message: "Error saving image file.",
				});
			}
		});

		// Add the unique file paths to the payload
		req.body.image = imagePath;

		pool.query("INSERT INTO banner SET ?", req.body, (error, results) => {
			if (error) {
				return res.status(500).json({
					message: "Error creating banner",
					error: error.message,
				});
			}

			return res.status(200).json({
				message: "Banner created successfully",
				bannerId: results.insertId,
			});
		});
	},
	getAllBanners: (req, res) => {
		pool.query(
			"SELECT * FROM banner ORDER BY id DESC",
			(error, results) => {
				// Handle any errors
				if (error) {
					return res.status(500).json({
						message: "Error retrieving banners",
						error: error.message,
					});
				}
				return res.status(200).json({
					message: "Banners retrieved successfully",
					banners: results,
				});
			}
		);
	},
	deleteBanner: (req, res) => {
		const id = req.params.id;

		// Retrieve the image path before deleting the banner
		pool.query(
			"SELECT image FROM banner WHERE id = ?",
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
						message: "Banner not found",
					});
				}

				const imagePath = results[0].image;

				// Delete the banner and associated image
				pool.query(
					"DELETE FROM banner WHERE id = ?",
					[id],
					(error, deleteResults) => {
						if (error) {
							return res.status(500).json({
								message: "Error deleting banner",
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
									message: "Banner deleted successfully",
								});
							});
						} else {
							// Banner with the provided ID was not found
							return res.status(404).json({
								message: "Banner not found",
							});
						}
					}
				);
			}
		);
	},
};
