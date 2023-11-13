const pool = require("../config/db");

const CheckPhoneExists = async (phone) => {
	return new Promise((resolve, reject) => {
		pool.query(
			"SELECT id FROM user WHERE phone = ?",
			[phone],
			(error, results) => {
				if (error) {
					reject(error);
				} else {
					resolve(results.length > 0);
				}
			}
		);
	});
};

module.exports = CheckPhoneExists;
