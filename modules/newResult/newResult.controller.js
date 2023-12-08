const pool = require("../../config/db");
const NodeCache = require("node-cache");
const cache = new NodeCache();
const util = require("util");
const query = util.promisify(pool.query).bind(pool);

module.exports = {
	createNewResult: async (req, res) => {
		const {
			name,
			examName,
			className,
			role,
			year,
			section,
			newRole,
			subjectResult,
		} = req.body;
		try {
			const resultData = {
				name: name,
				examName: examName,
				className: className,
				role: role,
				year: year,
				section: section,
				newRole: newRole,
				subjectResult: JSON.stringify(subjectResult),
			};

			const results = await query(
				"SELECT * FROM new_results WHERE role = ? AND className = ? AND year = ? AND section = ?",
				[role, className, year, section]
			);
			if (results.length > 0) {
				return res.status(404).json({
					message: "Result Already Exists with this Role",
				});
			}

			const insertResult = await query(
				"INSERT INTO new_results SET ?",
				resultData
			);
			cache.del("new_results");

			return res.status(200).json({
				message: "Result created successfully",
				resultId: insertResult.insertId,
			});
		} catch (error) {
			return res.status(500).json({
				message: "Error creating result",
				error: error.message,
			});
		}
	},

	getAllNewResults: async (req, res) => {
		try {
			const cachedOldResults = cache.get("new_results");
			if (cachedOldResults) {
				return res.status(200).json({
					message: "Results retrieved from cache",
					total: cachedOldResults.total,
					new_results: cachedOldResults.parsedResults,
				});
			}

			const countResults = await query(
				"SELECT COUNT(*) AS total FROM new_results"
			);
			const total = countResults[0].total;

			const results = await query(
				"SELECT * FROM new_results ORDER BY id DESC"
			);
			const parsedResults = results.map((result) => {
				return {
					...result,
					subjectResult: JSON.parse(result.subjectResult),
				};
			});

			cache.set("new_results", {
				total,
				parsedResults,
			});

			return res.status(200).json({
				message: "Results retrieved successfully",
				total: total,
				new_results: parsedResults,
			});
		} catch (error) {
			return res.status(500).json({
				message: "Error retrieving results",
				error: error.message,
			});
		}
	},

	getNewResultByRoll: async (req, res) => {
		try {
			const { examName, className, role, year, section } = req.body;

			const results = await query(
				"SELECT * FROM new_results WHERE examName = ? AND className = ? AND role = ? AND year = ? AND section = ?",
				[examName, className, role, year, section]
			);

			if (!results || results.length === 0 || !results[0]) {
				return res.status(404).json({
					message: "Result not found",
				});
			}

			const parsedResult = {
				...results[0],
				subjectResult: JSON.parse(results[0].subjectResult),
			};

			return res.status(200).json({
				message: "Result retrieved successfully",
				result: parsedResult,
			});
		} catch (error) {
			return res.status(500).json({
				message: "Error getting result",
				error: error.message,
			});
		}
	},

	getNewResultById: async (req, res) => {
		try {
			const id = req.params.id;
			const results = await query(
				"SELECT * FROM new_results WHERE id = ?",
				[id]
			);
			if (results.length === 0) {
				return res.status(404).json({
					message: "Result not found",
				});
			}

			return res.status(200).json({
				message: "Result retrieved successfully",
				result: results[0],
			});
		} catch (error) {
			return res.status(500).json({
				message: "Error getting result",
				error: error.message,
			});
		}
	},

	updateNewResult: async (req, res) => {
		try {
			const id = req.params.id;
			const {
				className,
				examName,
				role,
				year,
				section,
				newRole,
				subjectResultToUpdate,
			} = req.body;

			if (subjectResultToUpdate) {
				const existingResult = await query(
					"SELECT * FROM new_results WHERE id = ?",
					[id]
				);
				if (existingResult.length === 0) {
					return res.status(404).json({
						message: "Result not found",
					});
				}

				const existingResultData = existingResult[0];
				const existingSubjectResult = JSON.parse(
					existingResultData.subjectResult
				);

				for (const subject of subjectResultToUpdate) {
					const existingSubject = existingSubjectResult.find(
						(item) => item.type === subject.type
					);

					if (existingSubject) {
						existingSubject.value = subject.value;
					} else {
						existingSubjectResult.push(subject);
					}
				}

				existingResultData.subjectResult = JSON.stringify(
					existingSubjectResult
				);

				const updateResult = await query(
					"UPDATE new_results SET ? WHERE id = ?",
					[existingResultData, id]
				);
				if (updateResult.affectedRows === 0) {
					return res.status(404).json({
						message: "Result not found",
					});
				}

				cache.del("new_results");

				return res.status(200).json({
					message: "Result updated successfully",
				});
			} else {
				const updateFields = {};

				if (className) updateFields.className = className;
				if (examName) updateFields.examName = examName;
				if (role) updateFields.role = role;
				if (year) updateFields.year = year;
				if (section) updateFields.section = section;
				if (newRole) updateFields.newRole = newRole;

				const existingResult = await query(
					"SELECT * FROM new_results WHERE id = ?",
					[id]
				);

				if (existingResult.length === 0) {
					return res.status(404).json({
						message: "Result not found",
					});
				}

				try {
					const updateResult = await query(
						"UPDATE new_results SET ? WHERE id = ?",
						[updateFields, id]
					);

					if (updateResult.affectedRows === 0) {
						return res.status(404).json({
							message: "Result not found",
						});
					}

					cache.del("new_results");

					return res.status(200).json({
						message: "Result fields updated successfully",
					});
				} catch (error) {
					console.error("Error updating fields:", error);
					return res.status(500).json({
						message: "Failed to update fields",
					});
				}
			}
		} catch (error) {
			return res.status(500).json({
				message: "Error updating result",
				error: error.message,
			});
		}
	},

	deleteNewResult: async (req, res) => {
		try {
			const id = req.params.id;

			const deleteResult = await query(
				"DELETE FROM new_results WHERE id = ?",
				[id]
			);
			if (deleteResult.affectedRows === 0) {
				return res.status(404).json({
					message: "Result not found",
				});
			}

			cache.del("new_results");

			return res.status(200).json({
				message: "Result deleted successfully",
			});
		} catch (error) {
			return res.status(500).json({
				message: "Error deleting result",
				error: error.message,
			});
		}
	},
};
