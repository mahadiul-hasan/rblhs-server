const util = require("util");
const NodeCache = require("node-cache");
const pool = require("../../config/db");
const cache = new NodeCache();
const queryAsync = util.promisify(pool.query).bind(pool);

module.exports = {
	createStudent: async (req, res) => {
		try {
			const result = await queryAsync(
				"INSERT INTO students SET ?",
				req.body
			);

			cache.del(`students_${req.body.className}`);
			cache.del("students");
			cache.del(`student_${result.insertId}`);

			return res.status(200).json({
				message: "Student created successfully",
				studentId: result.insertId,
			});
		} catch (error) {
			return res.status(500).json({
				message: "Error creating student",
				error: error.message,
			});
		}
	},

	getAllStudents: async (req, res) => {
		const cachedData = cache.get("students");

		if (cachedData) {
			return res.status(200).json({
				message: "Students fetched from cache",
				total: cachedData.total,
				students: cachedData.results,
			});
		}

		try {
			const countResults = await queryAsync(
				"SELECT COUNT(*) AS total FROM students"
			);

			const total = countResults[0].total;

			const results = await queryAsync(
				"SELECT * FROM students ORDER BY className"
			);

			// Store data in cache
			cache.set("students", {
				total,
				results,
			});

			return res.status(200).json({
				message: "Students retrieved successfully",
				total: total,
				students: results,
			});
		} catch (error) {
			return res.status(500).json({
				message: "Error fetching students",
				error: error.message,
			});
		}
	},

	getStudentById: async (req, res) => {
		try {
			const id = req.params.id;

			const cachedStudent = cache.get(`student_${id}`);
			if (cachedStudent) {
				return res.status(200).json({
					message: "Student retrieved from cache",
					student: cachedStudent.results,
				});
			}

			const student = await queryAsync(
				"SELECT * FROM students WHERE id = ?",
				[id]
			);

			if (student.length === 0) {
				return res.status(404).json({
					message: "Student not found",
				});
			}

			const results = student[0];

			cache.set(`student_${results.id}`, { results });

			return res.status(200).json({
				message: "Student retrieved successfully",
				student: results,
			});
		} catch (error) {
			return res.status(500).json({
				message: "Error getting notice",
				error: error.message,
			});
		}
	},

	getOneStudent: async (req, res) => {
		try {
			const { className, role, year, section } = req.body;

			const results = await queryAsync(
				"SELECT * FROM students WHERE className = ? AND role = ? AND year = ? AND section = ?",
				[className, role, year, section]
			);

			if (!results || results.length === 0 || !results[0]) {
				return res.status(404).json({
					message: "Student not found",
				});
			}

			return res.status(200).json({
				message: "Student retrieved successfully",
				student: results,
			});
		} catch (error) {
			return res.status(500).json({
				message: "Error getting result",
				error: error.message,
			});
		}
	},

	getStudentByClass: async (req, res) => {
		const className = req.params.className;

		// Check if data exists in cache
		const cacheKey = `students_${className}`;
		const cachedData = cache.get(cacheKey);

		if (cachedData) {
			return res.status(200).json({
				message: "Students fetched from cache",
				total: cachedData.students.length,
				result: {
					className: className,
					muslims: cachedData.muslims,
					hindu: cachedData.hindu,
					total: cachedData.totalStudents,
					students: cachedData.students,
				},
			});
		}

		try {
			const students = await queryAsync(
				"SELECT * FROM students WHERE className = ? ORDER BY role",
				[className]
			);

			// Get total count of students in the class
			const countQuery =
				"SELECT SUM(muslimStudents) AS muslims, SUM(hinduStudents) AS hindu, SUM(totalStudents) AS totalStudents FROM classes WHERE className = ?";
			const totalCount = await queryAsync(countQuery, className);

			const { muslims, hindu, totalStudents } = totalCount[0];

			// Store data in cache
			cache.set(cacheKey, {
				students,
				muslims,
				hindu,
				totalStudents,
			});

			return res.status(200).json({
				message: "Students retrieved successfully",
				total: students.length,
				result: {
					className: className,
					muslims,
					hindu,
					total: totalStudents,
					students,
				},
			});
		} catch (error) {
			return res.status(500).json({
				message: "Error fetching students",
				error: error.message,
			});
		}
	},

	updateStudent: async (req, res) => {
		const id = req.params.id;
		const updatedStudentData = req.body;

		try {
			await queryAsync("UPDATE students SET ? WHERE id = ?", [
				updatedStudentData,
				id,
			]);

			// Invalidate the cache for this student
			cache.del(`students_${updatedStudentData.className}`);
			cache.del(`student_${updatedStudentData.id}`);
			cache.del("students");

			return res.status(200).json({
				message: "Student updated successfully",
			});
		} catch (error) {
			return res.status(500).json({
				message: "Error updating student",
				error: error.message,
			});
		}
	},

	deleteStudent: async (req, res) => {
		const id = req.params.id;

		try {
			const classNameResult = await queryAsync(
				"SELECT className FROM students WHERE id = ?",
				[id]
			);
			const className = classNameResult[0].className;

			await queryAsync("DELETE FROM students WHERE id = ?", [id]);

			// Invalidate the cache for this class
			cache.del(`students_${className}`);
			cache.del(`student_${id}`);
			cache.del("students");

			return res.status(200).json({
				message: "Student deleted successfully",
			});
		} catch (error) {
			return res.status(500).json({
				message: "Error deleting student",
				error: error.message,
			});
		}
	},

	deleteStudentsByClassAndYear: async (req, res) => {
		const { className, year } = req.body;

		try {
			// Find ids based on className and year
			const studentIdsResult = await queryAsync(
				"SELECT id FROM students WHERE className = ? AND year = ?",
				[className, year]
			);
			const studentIds = studentIdsResult.map((row) => row.id);

			if (studentIds.length === 0) {
				return res.status(404).json({
					message:
						"No students found for the given class name and year.",
				});
			}

			// Delete students based on found ids
			await queryAsync(
				"DELETE FROM students WHERE className = ? AND year = ?",
				[className, year]
			);

			// Invalidate the cache for this class
			cache.del(`students_${className}`);
			cache.del(`student_${studentIds}`);
			cache.del("students");

			return res.status(200).json({
				message: "Students deleted successfully",
				deletedStudentIds: studentIds,
			});
		} catch (error) {
			return res.status(500).json({
				message: "Error deleting students",
				error: error.message,
			});
		}
	},
};
