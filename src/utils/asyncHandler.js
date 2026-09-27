// eliminates repetetive try-catch blocks across all controller

const asyncHandler = (requestHandler) => {
    return (req,res,next) => {
        Promise.resolve(requestHandler(req,res,next)).catch((err) => next(err));
    };
};

module.exports = asyncHandler;