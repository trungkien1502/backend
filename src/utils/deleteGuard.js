const RELATED_DATA_MESSAGE = "Không được phép vì còn dữ liệu liên quan";

const throwRelatedDataError = () => {
    const error = new Error(RELATED_DATA_MESSAGE);
    error.statusCode = 400;
    throw error;
};

module.exports = {
    RELATED_DATA_MESSAGE,
    throwRelatedDataError
};
