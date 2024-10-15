import { v2 as cloudinary } from "cloudinary"
import { fs } from "fs"

// Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadResult = async ( localFilePath ) => {
    try {
        if (!localFilePath) {
            console.log("file path not find...");
            return null;
        }

        const response = await cloudinary.uploader.upload(localFilePath, 
            {
                resource_type: "auto",
            }
        )

        console.log("file uploaded on cloudinary successfully");
        return response;
    } 
    catch(err) {
        fs.unlinkSync(localFilePath)
        return null;
    }
} 