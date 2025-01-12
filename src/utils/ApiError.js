class ApiError extends Error{
    constructer(
        statusCode,
        message ="Something went wrong",
        errors = [],
        stack = ""

        ){
            super(message)
            this.statusCode = statusCode
            this.data = nullthis.message = message
            this.success = false;
            this.errors = errors

            if( stack){
                this.stack = stack
            }
            else{
                Error.captureStackTrace(this, this.constructer)
            }
        }
}
export {ApiError}