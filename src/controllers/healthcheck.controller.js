// checks if the health of the server is ok i guess

import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const healthcheck = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, 'OK', "Health Check Passed."))
})

export { healthcheck }