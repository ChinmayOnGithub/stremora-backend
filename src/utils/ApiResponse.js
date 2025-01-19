// standerdisation of response messages using a util class

class ApiResponse {
    constructor(statusCode, data, message = "Success") {
        this.statusCode = statusCode;
        this.data = data;
        this.message = message;
        this.success = statusCode < 400;
    }

    static success(data, message = "Success") {
        return new ApiResponse(200, data, message);
    }

    static error(statusCode, message = "Error", data = null) {
        return new ApiResponse(statusCode, data, message);
    }
}

export { ApiResponse }