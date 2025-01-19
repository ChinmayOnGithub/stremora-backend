

// its a classic higher order function
const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch
            ((err) => next(err));
        // this Promise can be replaced with the trycatch block as well but this feels more modern
    }
}
// next is also a middleware

export { asyncHandler }


// every async function has to be wrote inside the try catch block which is really hectic
// hence we created a function that automatically resolves and put the function in try-catch ...