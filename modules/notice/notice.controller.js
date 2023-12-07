const pool = require("../../config/db");
const NodeCache = require("node-cache");
const cache = new NodeCache();
const util = require("util");
const queryAsync = util.promisify(pool.query).bind(pool);

module.exports = {
	createNotice: async (req, res) => {
		try {
			const results = await queryAsync(
				"INSERT INTO notices SET ?",
				req.body
			);

			cache.del("notices");
			cache.del(`notice_${results.insertId}`);

			return res.status(200).json({
				message: "Notice created successfully",
				noticeId: results.insertId,
			});
		} catch (error) {
			return res.status(500).json({
				message: "Error creating notice",
				error: error.message,
			});
		}
	},
	getAllNotices: async (req, res) => {
		try {
			const cachedNotices = cache.get("notices");
			if (cachedNotices) {
				return res.status(200).json({
					message: "Notices retrieved from cache",
					total: cachedNotices.total,
					notices: cachedNotices.results,
				});
			}

			const countResults = await queryAsync(
				"SELECT COUNT(*) AS total FROM notices"
			);
			const total = countResults[0].total;

			const results = await queryAsync(
				"SELECT * FROM notices ORDER BY id DESC"
			);

			cache.set("notices", {
				total,
				results,
			});

			return res.status(200).json({
				message: "Notices retrieved successfully",
				total,
				notices: results,
			});
		} catch (error) {
			return res.status(500).json({
				message: "Error retrieving notices",
				error: error.message,
			});
		}
	},
	getNoticeById: async (req, res) => {
		try {
			const id = req.params.id;

			const cachedNotices = cache.get(`notice_${id}`);
			if (cachedNotices) {
				return res.status(200).json({
					message: "Notice retrieved from cache",
					notice: cachedNotices.results,
				});
			}

			const notices = await queryAsync(
				"SELECT * FROM notices WHERE id = ?",
				[id]
			);

			if (notices.length === 0) {
				return res.status(404).json({
					message: "Notice not found",
				});
			}

			const results = notices[0];

			cache.set(`notice_${results.id}`, { results });

			return res.status(200).json({
				message: "Notice retrieved successfully",
				notice: results,
			});
		} catch (error) {
			return res.status(500).json({
				message: "Error getting notice",
				error: error.message,
			});
		}
	},
	updateNotice: async (req, res) => {
		try {
			const id = req.params.id;
			const updatedFields = req.body;

			const results = await queryAsync(
				"UPDATE notices SET ? WHERE id = ?",
				[updatedFields, id]
			);

			if (results.affectedRows === 0) {
				return res.status(404).json({
					message: "Notice not found",
				});
			}

			cache.del("notices");
			cache.del(`notice_${id}`);

			return res.status(200).json({
				message: "Notice updated successfully",
			});
		} catch (error) {
			return res.status(500).json({
				message: "Error updating notice",
				error: error.message,
			});
		}
	},
	deleteNotice: async (req, res) => {
		try {
			const id = req.params.id;

			const results = await queryAsync(
				"DELETE FROM notices WHERE id = ?",
				[id]
			);

			if (results.affectedRows === 0) {
				return res.status(404).json({
					message: "Notice not found",
				});
			}

			cache.del("notices");
			cache.del(`notice_${id}`);

			return res.status(200).json({
				message: "Notice deleted successfully",
			});
		} catch (error) {
			return res.status(500).json({
				message: "Error deleting notice",
				error: error.message,
			});
		}
	},
};
