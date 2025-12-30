/**
 * GCS Upload Service
 * Uses Cloud Function to get signed URLs for secure file uploads
 */

// Cloud Function URL - deployed!
const CLOUD_FUNCTION_URL = 'https://us-central1-gen-lang-client-0660652909.cloudfunctions.net/getSignedUrl';

interface SignedUrlResponse {
    uploadUrl: string;
    publicUrl: string;
    filePath: string;
}

/**
 * Get a signed URL for uploading a file to GCS
 */
export const getUploadSignedUrl = async (
    fileName: string,
    contentType: string,
    userId: string
): Promise<SignedUrlResponse> => {
    const response = await fetch(CLOUD_FUNCTION_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileName, contentType, userId }),
    });

    if (!response.ok) {
        throw new Error('Failed to get signed URL');
    }

    return response.json();
};

/**
 * Upload a file to GCS using a signed URL
 */
export const uploadToGCS = async (
    file: Blob,
    fileName: string,
    contentType: string,
    userId: string
): Promise<string> => {
    // Step 1: Get signed URL from Cloud Function
    const { uploadUrl, publicUrl } = await getUploadSignedUrl(fileName, contentType, userId);

    // Step 2: Upload file directly to GCS using signed URL
    const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
            'Content-Type': contentType,
        },
        body: file,
    });

    if (!uploadResponse.ok) {
        throw new Error('Failed to upload file to GCS');
    }

    // Return the public URL for accessing the file
    return publicUrl;
};

/**
 * Upload an audio blob to GCS
 */
export const uploadAudioToGCS = async (blob: Blob, userId: string): Promise<string> => {
    const fileName = `audio_${Date.now()}.webm`;
    return uploadToGCS(blob, fileName, 'audio/webm', userId);
};

/**
 * Upload an image file to GCS
 */
export const uploadImageToGCS = async (file: File, userId: string): Promise<string> => {
    const fileName = `photo_${Date.now()}_${file.name}`;
    return uploadToGCS(file, fileName, file.type, userId);
};
