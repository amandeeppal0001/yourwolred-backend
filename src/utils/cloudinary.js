import {v2 as cloudinary} from 'cloudinary';
import fs from "fs"

cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
    });

    const uploadOnCloudinary = async (localFilePath) => {
        try{
            if(!localFilePath) return null
            // uplaod the file on cloudinary 
            const response = await cloudinary.uploader.upload(localFilePath, {
                resource_type: "auto"
            })
            console.log("response:", response);
            //file has been uploaded on cloudinary successfully
            console.log("File is uploaded successfully on cloudinary",
             response.url);
            fs.unlinkSync(localFilePath) // delete the file from local storage as it is uploaded on cloudinary
            return response;
        } catch(error){
            fs.unlinkSync(localFilePath) // delete the file from local storage as it is not uploaded on cloudinary
           return null;
        }
    };
    const deleteFromCloudinary = async (cloudinaryFilepath) => {
        try {
          if (!cloudinaryFilepath) return null;
          const fileName = cloudinaryFilepath.split("/").pop().split(".")[0];
          /*cloudinaryFilepath.split("/"): Splits the file path into an array of components using the / character as a delimiter.
.pop(): Gets the last component of the array, which is usually the file name with its extension (e.g., image12345.png).
.split("."): Splits the file name into an array using the . character as a delimiter to separate the name and its extension (e.g., image12345 and png).
[0]: Extracts the name part of the file (without the extension).
This step ensures that Cloudinary receives the file's unique identifier (fileName), which is necessary for deletion.*/
          const response = await cloudinary.uploader.destroy(fileName);
          //cloudinary.uploader.destroy(fileName): Calls Cloudinary's destroy method, which deletes the file identified by fileName.
          //The response from the destroy operation (likely including a success/failure status) is stored in the response variable
          return response;
          //If the deletion is successful, the response from Cloudinary is returned.
        } catch (error) {
          console.log("Error while deleting file from cloudinary : ", error);
          return null;
        }
        /*
        Summary:
This function:

Validates input to ensure a filepath is provided.
Extracts the unique file identifier (fileName) from the provided Cloudinary URL/path.
Asynchronously deletes the file using Cloudinary’s destroy method.
Returns the response from the deletion operation.
Handles errors gracefully, logging them and returning null on failure.*/
      };

    export {
        uploadOnCloudinary,
        deleteFromCloudinary
    }