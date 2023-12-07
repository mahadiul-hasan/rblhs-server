const pool = require("../../config/db");
const NodeCache = require("node-cache");
const cache = new NodeCache();
const util = require("util");
const queryAsync = util.promisify(pool.query).bind(pool);

module.exports = {
	createClass: async (req, res) => {
		try {
			const result = await queryAsync(
				"SELECT * FROM classes WHERE className = ?",
				[req.body.className]
			);
			if (result.length > 0) {
				return res.status(404).json({
					message: "Class Already Exists",
				});
			}

			const results = await queryAsync(
				"INSERT INTO classes SET ?",
				req.body
			);

			cache.del("classes");

			return res.status(200).json({
				message: "Notice created successfully",
				classId: results.insertId,
			});
		} catch (error) {
			return res.status(500).json({
				message: "Error creating notice",
				error: error.message,
			});
		}
	},

	getAllClasses: async (req, res) => {
		try {
			const cachedClasses = cache.get("classes");
			if (cachedClasses) {
				return res.status(200).json({
					message: "Classes retrieved from cache",
					total: cachedClasses.total,
					classes: cachedClasses.results,
				});
			}

			const countResults = await queryAsync(
				"SELECT COUNT(*) AS total FROM classes"
			);
			const total = countResults[0].total;

			const results = await queryAsync(
				"SELECT * FROM classes ORDER BY className"
			);

			cache.set("classes", {
				total,
				results,
			});

			return res.status(200).json({
				message: "Classes retrieved successfully",
				total,
				classes: results,
			});
		} catch (error) {
			return res.status(500).json({
				message: "Error retrieving classes",
				error: error.message,
			});
		}
	},

	getClassById: async (req, res) => {
		try {
			const id = req.params.id;

			const cachedClass = cache.get(`class_${id}`);
			if (cachedClass) {
				return res.status(200).json({
					message: "Class retrieved from cache",
					class: cachedClass.results,
				});
			}

			const classes = await queryAsync(
				"SELECT * FROM classes WHERE id = ?",
				[id]
			);

			if (classes.length === 0) {
				return res.status(404).json({
					message: "Class not found",
				});
			}

			const results = classes[0];

			cache.set(`class_${results.id}`, { results });

			return res.status(200).json({
				message: "Class retrieved successfully",
				class: results,
			});
		} catch (error) {
			return res.status(500).json({
				message: "Error getting class",
				error: error.message,
			});
		}
	},

	updateClass: async (req, res) => {
		try {
			const id = req.params.id;
			const updatedFields = req.body;

			const results = await queryAsync(
				"UPDATE classes SET ? WHERE id = ?",
				[updatedFields, id]
			);

			if (results.affectedRows === 0) {
				return res.status(404).json({
					message: "Class not found",
				});
			}

			cache.del("classes");
			cache.del(`class_${id}`);

			return res.status(200).json({
				message: "Class updated successfully",
			});
		} catch (error) {
			return res.status(500).json({
				message: "Error updating class",
				error: error.message,
			});
		}
	},

	deleteClass: async (req, res) => {
		try {
			const id = req.params.id;

			const results = await queryAsync(
				"DELETE FROM classes WHERE id = ?",
				[id]
			);

			if (results.affectedRows === 0) {
				return res.status(404).json({
					message: "Class not found",
				});
			}

			cache.del("classes");
			cache.del(`class_${id}`);

			return res.status(200).json({
				message: "Class deleted successfully",
			});
		} catch (error) {
			return res.status(500).json({
				message: "Error deleting class",
				error: error.message,
			});
		}
	},
};
