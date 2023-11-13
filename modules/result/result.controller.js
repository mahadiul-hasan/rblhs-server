const pool = require("../../config/db");

module.exports = {
	createResult: async (req, res) => {
		const resultData = {
			name: req.body.name,
			examName: req.body.examName,
			className: req.body.className,
			role: req.body.role,
			year: req.body.year,
			subjectResult: JSON.stringify(req.body.subjectResult),
		};

		pool.query(
			"SELECT * FROM result WHERE role = ?",
			[req.body.role],
			(error, results) => {
				if (error) {
					return res.status(500).json({
						message: "Error fetching existing result data",
						error: error.message,
					});
				}

				if (results.length > 0) {
					return res.status(404).json({
						message: "Result Already Exists with this Role",
					});
				}

				pool.query(
					"INSERT INTO result SET ?",
					resultData,
					(error, results) => {
						if (error) {
							return res.status(500).json({
								message: "Error creating result",
								error: error.message,
							});
						}

						return res.status(200).json({
							message: "Result created successfully",
							resultId: results.insertId,
						});
					}
				);
			}
		);
	},
	getAllResults: (req, res) => {
		pool.query(
			"SELECT COUNT(*) AS total FROM result",
			(countError, countResults) => {
				if (countError) {
					return res.status(500).json({
						message: "Error retrieving result count",
						error: countError.message,
					});
				}

				const total = countResults[0].total;

				// Retrieve all results
				pool.query(
					"SELECT * FROM result ORDER BY id DESC",
					(error, results) => {
						if (error) {
							return res.status(500).json({
								message: "Error retrieving results",
								error: error.message,
							});
						}

						const parsedResults = results.map((result) => {
							return {
								...result,
								subjectResult: JSON.parse(result.subjectResult),
							};
						});

						return res.status(200).json({
							message: "Results retrieved successfully",
							total: total,
							results: parsedResults,
						});
					}
				);
			}
		);
	},
	getResultByRoll: (req, res) => {
		const { examName, className, role, year, section } = req.body;
		const params = [examName, className, role, year]; // Removed section from params

		let query =
			"SELECT * FROM result WHERE examName = ? AND className = ? AND role = ? AND year = ?";

		if (section) {
			query += " AND section = ?";
			params.push(section);
		}

		pool.query(query, params, (error, results) => {
			if (error) {
				return res.status(500).json({
					message: "Error getting result",
					error: error.message,
				});
			}
			if (results.length === 0) {
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
		});
	},
	getResultById: (req, res) => {
		const id = req.params.id;
		pool.query(
			"SELECT * FROM result WHERE id = ?",
			[id],
			(error, results) => {
				if (error) {
					return res.status(500).json({
						message: "Error getting result",
						error: error.message,
					});
				}
				if (results.length === 0) {
					return res.status(404).json({
						message: "Result not found",
					});
				}

				return res.status(200).json({
					message: "Result retrieved successfully",
					result: results[0],
				});
			}
		);
	},
	updateResult: async (req, res) => {
		const id = req.params.id;
		const subjectResultToUpdate = req.body.subjectResult;

		pool.query(
			"SELECT * FROM result WHERE id = ?",
			id,
			(error, existingResult) => {
				if (error) {
					return res.status(500).json({
						message: "Error fetching existing result data",
						error: error.message,
					});
				}

				if (existingResult.length === 0) {
					return res.status(404).json({
						message: "Result not found",
					});
				}

				const existingResultData = existingResult[0];
				const existingSubjectResult = JSON.parse(
					existingResultData.subjectResult
				);

				// Merge existing subjectResult with new subjectResult
				for (const subject of subjectResultToUpdate) {
					const existingSubject = existingSubjectResult.find(
						(item) => item.subject === subject.subject
					);

					if (existingSubject) {
						existingSubject.mark = subject.mark;
					} else {
						existingSubjectResult.push(subject);
					}
				}

				existingResultData.subjectResult = JSON.stringify(
					existingSubjectResult
				);

				// Update the result with the merged data
				pool.query(
					"UPDATE result SET ? WHERE id = ?",
					[existingResultData, id],
					(updateError, results) => {
						if (updateError) {
							return res.status(500).json({
								message: "Error updating result",
								error: updateError.message,
							});
						}

						if (results.affectedRows === 0) {
							return res.status(404).json({
								message: "Result not found",
							});
						}

						return res.status(200).json({
							message: "Result updated successfully",
						});
					}
				);
			}
		);
	},
	deleteResult: (req, res) => {
		const id = req.params.id;

		pool.query(
			"DELETE FROM result WHERE id = ?",
			[id],
			(error, results) => {
				if (error) {
					return res.status(500).json({
						message: "Error deleting result",
						error: error.message,
					});
				}

				if (results.affectedRows === 0) {
					return res.status(404).json({
						message: "Result not found",
					});
				}

				return res.status(200).json({
					message: "Result deleted successfully",
				});
			}
		);
	},
};
