// standerdisation of error messages using a util class

class ApiError extends Error {
    constructor(
        statusCode,
        message = "Something went wrong!",
        errors = [], // many errors can be there -> array
        stack = ""
    ) {
        super(message); // constructor from Error class
        this.statusCode = statusCode;
        this.message = message;
        this.data = null;
        this.success = false;
        this.errors = errors;

        if (stack) {
            this.stack = stack
        } else {
            Error.captureStackTrace(this, this.constructor)
        }

    }

    toJSON() {
        return {
            statusCode: this.statusCode,
            message: this.message,
            data: this.data,
            success: this.success,
            errors: this.errors
        };
    }
}


export { ApiError }