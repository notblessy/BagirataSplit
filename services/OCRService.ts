import TextRecognition from "@react-native-ml-kit/text-recognition";

/**
 * OCR Service for extracting text from images using React Native ML Kit
 * This service provides text recognition capabilities for receipt scanning
 */

export interface OCRResult {
  success: boolean;
  text?: string;
  confidence?: number;
  error?: string;
}

export class OCRService {
  /**
   * Extract text from image URI using React Native ML Kit
   */
  static async extractTextFromImageUri(imageUri: string): Promise<OCRResult> {
    try {
      const result = await TextRecognition.recognize(imageUri);

      if (result && result.text) {
        return {
          success: true,
          text: result.text,
          confidence: 0.9, // ML Kit doesn't provide confidence scores for the overall text
        };
      } else {
        return {
          success: false,
          error: "No text detected in image",
        };
      }
    } catch (error: any) {
      console.error("OCR extraction error:", error);
      return {
        success: false,
        error: error.message || "Failed to extract text from image",
      };
    }
  }

  /**
   * Extract text from base64 image (legacy method for backward compatibility)
   * Note: ML Kit works better with file URIs, so this converts base64 to file first
   */
  static async extractTextFromImage(imageBase64: string): Promise<OCRResult> {
    try {
      // ML Kit works better with file URIs
      // For base64, we'll need to convert it to a temporary file
      console.log("OCR: Base64 input detected, converting to file URI...");

      // Create a temporary file from base64
      const tempUri = await this.saveBase64ToTempFile(imageBase64);

      // Use the URI-based method
      return await this.extractTextFromImageUri(tempUri);
    } catch (error: any) {
      console.error("OCR base64 extraction error:", error);
      return {
        success: false,
        error: error.message || "Failed to extract text from base64 image",
      };
    }
  }

  /**
   * Save base64 image to temporary file and return URI
   */
  private static async saveBase64ToTempFile(base64: string): Promise<string> {
    const FileSystem = await import("expo-file-system");

    // Create a temporary file path
    const tempPath = `${
      FileSystem.documentDirectory
    }temp_receipt_${Date.now()}.jpg`;

    // Write base64 to file
    await FileSystem.writeAsStringAsync(tempPath, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return tempPath;
  }

  /**
   * Check if OCR service is available
   */
  static async isAvailable(): Promise<boolean> {
    try {
      // ML Kit should be available on both iOS and Android
      return typeof TextRecognition.recognize === "function";
    } catch (error) {
      console.error("OCR availability check failed:", error);
      return false;
    }
  }

  /**
   * Clean and preprocess text for better recognition results
   */
  static preprocessText(text: string): string {
    return text
      .replace(/\s+/g, " ") // Normalize whitespace
      .replace(/[^\w\s\d.,:-]/g, "") // Remove special characters except common ones
      .trim();
  }
}
