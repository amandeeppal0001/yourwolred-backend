import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";



const healthcheck = asyncHandler(async(req, res)=>{
     

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "ok"));
});

export{
    healthcheck,
}