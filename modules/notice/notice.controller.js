const pool = require("../../config/db");

module.exports = {
	createNotice: async (req, res) => {
		req.body.createdAt = new Date();
		pool.query("INSERT INTO notice SET ?", req.body, (error, results) => {
			if (error) {
				return res.status(500).json({
					message: "Error creating notice",
					error: error.message,
				});
			}

			return res.status(200).json({
				message: "Notice created successfully",
				noticeId: results.insertId,
			});
		});
	},
	getAllNotices: (req, res) => {
		pool.query(
			"SELECT COUNT(*) AS total FROM notice",
			(countError, countResults) => {
				if (countError) {
					return res.status(500).json({
						message: "Error retrieving notice count",
						error: countError.message,
					});
				}

				const total = countResults[0].total;

				// Retrieve all notices
				pool.query(
					"SELECT * FROM notice ORDER BY id DESC",
					(error, results) => {
						if (error) {
							return res.status(500).json({
								message: "Error retrieving notices",
								error: error.message,
							});
						}

						return res.status(200).json({
							message: "Notices retrieved successfully",
							total: total,
							notices: results,
						});
					}
				);
			}
		);
	},
	getNoticeById: (req, res) => {
		const id = req.params.id;
		pool.query(
			"SELECT * FROM notice WHERE id = ?",
			[id],
			(error, results) => {
				if (error) {
					return res.status(500).json({
						message: "Error getting notice",
						error: error.message,
					});
				}
				if (results.length === 0) {
					return res.status(404).json({
						message: "Notice not found",
					});
				}

				return res.status(200).json({
					message: "Notice retrieved successfully",
					notice: results[0],
				});
			}
		);
	},
	updateNotice: (req, res) => {
		const id = req.params.id;
		const updatedFields = req.body;

		pool.query(
			"UPDATE notice SET ? WHERE id = ?",
			[updatedFields, id],
			(error, results) => {
				if (error) {
					return res.status(500).json({
						message: "Error updating notice",
						error: error.message,
					});
				}

				if (results.affectedRows === 0) {
					return res.status(404).json({
						message: "Notice not found",
					});
				}

				return res.status(200).json({
					message: "Notice updated successfully",
				});
			}
		);
	},
	deleteNotice: (req, res) => {
		const id = req.params.id;

		pool.query(
			"DELETE FROM notice WHERE id = ?",
			[id],
			(error, results) => {
				if (error) {
					return res.status(500).json({
						message: "Error deleting notice",
						error: error.message,
					});
				}

				if (results.affectedRows === 0) {
					return res.status(404).json({
						message: "Notice not found",
					});
				}

				return res.status(200).json({
					message: "Notice deleted successfully",
				});
			}
		);
	},
};
