const util = require("util");
const NodeCache = require("node-cache");
const cache = new NodeCache();
const pool = require("../../config/db");
const queryAsync = util.promisify(pool.query).bind(pool);

module.exports = {
	createAndGetPaymentData: async (req, res) => {
		try {
			const results = await queryAsync(
				"INSERT INTO payments SET ?",
				req.body
			);

			const paymentId = results.insertId;

			if (paymentId) {
				const payment = await queryAsync(
					"SELECT * FROM payments WHERE id = ?",
					[paymentId]
				);

				const student = await queryAsync(
					"SELECT * FROM students WHERE id = ?",
					[req.body.studentId]
				);

				const paymentData = payment[0];
				const studentData = student[0];

				cache.del("payments");

				const formattedData = {
					name: studentData.name,
					class: studentData.className,
					role: studentData.role,
					section: studentData.section,
					year: studentData.year,
					title: paymentData.title,
					amount: paymentData.amount,
					date: paymentData.date.toISOString().split("T")[0],
				};

				res.status(200).json({
					message: "Payment Success",
					results: formattedData,
				});
			} else {
				res.status(500).json({
					message: "Something went wrong. Please try again later",
				});
			}
		} catch (error) {
			res.status(500).json({
				message: "Internal server error",
				error: error,
			});
		}
	},

	getAllPayments: async (req, res) => {
		try {
			const cachedPayments = cache.get("payments");
			if (cachedPayments) {
				return res.status(200).json({
					message: "Payments retrieved from cache",
					total: cachedPayments.total,
					payments: cachedPayments.results,
				});
			}

			const countResults = await queryAsync(
				"SELECT COUNT(*) AS total FROM payments"
			);
			const total = countResults[0].total;

			const results = await queryAsync(
				"SELECT p.*, s.* FROM payments p JOIN students s ON p.studentId = s.id ORDER BY p.id DESC"
			);

			cache.set("payments", {
				total,
				results,
			});

			return res.status(200).json({
				message: "Payments retrieved successfully",
				total,
				payments: results,
			});
		} catch (error) {
			res.status(500).json({
				message: "Internal server error",
				error: error,
			});
		}
	},

	deletePayment: async (req, res) => {
		try {
			const id = req.params.id;

			const results = await queryAsync(
				"DELETE FROM payments WHERE id = ?",
				[id]
			);

			if (results.affectedRows === 0) {
				return res.status(404).json({
					message: "Payment not found",
				});
			}

			cache.del("payments");

			return res.status(200).json({
				message: "Payment deleted successfully",
			});
		} catch (error) {
			return res.status(500).json({
				message: "Error deleting payment",
				error: error.message,
			});
		}
	},
};
