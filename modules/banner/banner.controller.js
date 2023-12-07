const path = require("path");
const fs = require("fs");
const pool = require("../../config/db");
const GenerateUniqueFileName = require("../../utils/GenerateUniqueFileName");
const NodeCache = require("node-cache");
const cache = new NodeCache();
const util = require("util");
const queryAsync = util.promisify(pool.query).bind(pool);

module.exports = {
	createBanner: async (req, res) => {
		try {
			if (!req.files || !req.files.image) {
				return res.status(404).json({
					message: "File not found",
				});
			}

			const imageFile = req.files.image;
			const imageFileName = await GenerateUniqueFileName(imageFile.name);
			const imagePath = path.join("uploads", "banners", imageFileName);

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
					const results = await queryAsync(
						"INSERT INTO banners SET ?",
						req.body
					);

					cache.del("banners");

					return res.status(200).json({
						message: "Banner created successfully",
						bannerId: results.insertId,
					});
				} catch (error) {
					return res.status(500).json({
						message: "Error creating banner",
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

	getAllBanners: async (req, res) => {
		try {
			const cachedBanners = cache.get("banners");
			if (cachedBanners) {
				return res.status(200).json({
					message: "Banners retrieved from cache",
					banners: cachedBanners.results,
				});
			}

			const results = await queryAsync(
				"SELECT * FROM banners ORDER BY id DESC"
			);

			cache.set("banners", {
				results,
			});

			return res.status(200).json({
				message: "Banners retrieved successfully",
				banners: results,
			});
		} catch (error) {
			return res.status(500).json({
				message: "Error retrieving banners",
				error: error.message,
			});
		}
	},

	deleteBanner: async (req, res) => {
		const id = req.params.id;

		try {
			const results = await queryAsync(
				"SELECT image FROM banners WHERE id = ?",
				[id]
			);

			if (results.length === 0) {
				return res.status(404).json({
					message: "Banner not found",
				});
			}

			const imagePath = results[0].image;

			const deleteResults = await queryAsync(
				"DELETE FROM banners WHERE id = ?",
				[id]
			);

			if (deleteResults.affectedRows === 1) {
				fs.unlink(imagePath, (err) => {
					if (err) {
						console.error("Error deleting profile image:", err);
					}
				});

				cache.del("banners");

				return res.status(200).json({
					message: "Banner deleted successfully",
				});
			} else {
				return res.status(404).json({
					message: "Banner not found",
				});
			}
		} catch (error) {
			return res.status(500).json({
				message: "Error deleting banner",
				error: error.message,
			});
		}
	},
};
