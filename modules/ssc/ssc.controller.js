const path = require("path");
const fs = require("fs");
const pool = require("../../config/db");
const GenerateUniqueFileName = require("../../utils/GenerateUniqueFileName");
const NodeCache = require("node-cache");
const cache = new NodeCache();
const util = require("util");
const queryAsync = util.promisify(pool.query).bind(pool);

module.exports = {
	createSSCResult: async (req, res) => {
		try {
			if (!req.files || !req.files.pdf) {
				return res.status(404).json({
					message: "File not found",
				});
			}

			const pdfFile = req.files.pdf;
			const pdfFileName = await GenerateUniqueFileName(pdfFile.name);
			const pdfPath = path.join("uploads", "results", pdfFileName);

			pdfFile.mv(pdfPath, async (err) => {
				if (err) {
					return res.status(500).json({
						message: "Error saving pdf file.",
						error: err.message,
					});
				}

				// Add the unique file paths to the payload
				req.body.pdf = pdfPath;

				try {
					const existingResult = await queryAsync(
						"SELECT * FROM ssc WHERE year = ?",
						[req.body.year]
					);

					if (existingResult.length > 0) {
						fs.unlink(pdfPath, (err) => {
							if (err) {
								console.error("Error deleting pdf");
							}
						});
						return res.status(400).json({
							message: "SSC Result Already Exists in This Year",
						});
					}

					const insertResults = await queryAsync(
						"INSERT INTO ssc SET ?",
						req.body
					);

					cache.del("ssc");

					return res.status(200).json({
						message: "SSC Result created successfully",
						classRoutineId: insertResults.insertId,
					});
				} catch (error) {
					return res.status(500).json({
						message: "Error creating SSC Result",
						error: error.message,
					});
				}
			});
		} catch (error) {
			if (req.body.pdf) {
				fs.unlink(req.body.pdf, (err) => {
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

	getAllSSCResults: async (req, res) => {
		try {
			const cachedAllSSC = cache.get("ssc");
			if (cachedAllSSC) {
				return res.status(200).json({
					message: "SSC Result retrieved from cache",
					sscResults: cachedAllSSC.results,
				});
			}

			const results = await queryAsync("SELECT * FROM ssc ORDER BY year");

			cache.set("ssc", {
				results,
			});

			return res.status(200).json({
				message: "SSC Results retrieved successfully",
				sscResults: results,
			});
		} catch (error) {
			return res.status(500).json({
				message: "Error retrieving SSC Results",
				error: error.message,
			});
		}
	},

	deleteSSCResult: async (req, res) => {
		try {
			const id = req.params.id;
			const results = await queryAsync(
				"SELECT pdf FROM ssc WHERE id = ?",
				[id]
			);

			if (results.length === 0) {
				return res.status(404).json({
					message: "SSC Result not found",
				});
			}

			const pdfPath = results[0].pdf;
			const deleteResults = await queryAsync(
				"DELETE FROM ssc WHERE id = ?",
				[id]
			);

			if (deleteResults.affectedRows === 1) {
				fs.unlink(pdfPath, (err) => {
					if (err) {
						console.error("Error deleting pdf");
					}
				});

				cache.del("ssc");

				return res.status(200).json({
					message: "SSC Result deleted successfully",
				});
			} else {
				return res.status(404).json({
					message: "SSC Result not found",
				});
			}
		} catch (error) {
			return res.status(500).json({
				message: "Error deleting SSC Result",
				error: error.message,
			});
		}
	},
};
