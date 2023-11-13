const GenerateUniqueFileName = (originalFileName) => {
	const timestamp = new Date()
		.toISOString()
		.replace(/:/g, "-")
		.replace(/\./g, "-");
	const randomString = Math.random().toString(36).substring(2, 15);
	const uniqueFileName = `${timestamp}_${randomString}_${originalFileName}`;
	return uniqueFileName;
};

module.exports = GenerateUniqueFileName;
