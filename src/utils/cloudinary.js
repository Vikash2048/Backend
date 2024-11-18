import { v2 as cloudinary } from "cloudinary"
import fs  from "fs"
import path from "path"

// Configuration
cloudinary.config({ 
    cloud_name: "dcgluuga6", 
    api_key: "693974596184211", 
    api_secret: "ymgiiJXq7aI-st5pO284_nxOlGE"
});

const uploadOnCloudinary = async ( localFilePath ) => {
    try {
        if (localFilePath == null) {
            console.log("file path not find...");
            return null;
        }

        const fileName = path.basename(localFilePath, path.extname(localFilePath))
        const response = await cloudinary.uploader.upload(localFilePath, 
            {
                resource_type: "auto",
                display_name: fileName,
            }
        )

        console.log("file uploaded on cloudinary successfully", response.url);
        return response;
    } 
    catch(err) {
        fs.unlinkSync(localFilePath)
        return null;
    }
    finally{
        fs.unlinkSync(localFilePath)
    }
} 

export { uploadOnCloudinary }