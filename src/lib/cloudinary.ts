import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log(
  "Cloudinary configured with cloud name:",
  process.env.CLOUDINARY_CLOUD_NAME
);

export const uploadToCloudinary = {
  upload: async function (base64data: string,folder = "chat",type = "auto" as "image" | "video" | "raw" | "auto") {
    try {
      if (!process.env.CLOUDINARY_CLOUD_NAME ||!process.env.CLOUDINARY_API_KEY ||!process.env.CLOUDINARY_API_SECRET ) {
        throw new Error("Cloudinary configuration missing");
      }
      const uploadData = base64data.startsWith("data:")? base64data: `data:application/octet-stream;base64,${base64data}`;
      const result = await cloudinary.uploader.upload(uploadData, {folder: folder,resource_type: type,timeout: 60000,});

      return result;
    } catch (error: any) {
      throw new Error(`Failed to upload to Cloudinary: ${error.message}`);
    }
  },
  deleteFile: async function (publicId: string) {
    try {
      const result = await cloudinary.uploader.destroy(publicId);

      if (result.result !== "ok") {
        throw new Error("Failed to delete file from Cloudinary");
      }

      return result;
    } catch (error: any) {
      throw new Error(`Failed to delete from Cloudinary: ${error.message}`);
    }
  },
};
