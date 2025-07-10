import { Alert, Platform, PermissionsAndroid } from "react-native";
import DocumentScanner from "react-native-document-scanner-plugin";

export interface ScanResult {
  scannedImages: string[];
  status: "success" | "cancelled" | "error";
  message?: string;
}

export interface OCRResult {
  text: string;
  confidence: number;
  boundingBoxes?: any[];
}

export class ScannerService {
  static async requestCameraPermission(): Promise<boolean> {
    if (Platform.OS === "android") {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: "Camera Permission",
            message: "Bagirata needs access to your camera to scan receipts",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK",
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  }

  /**
   * Scan document using the device camera with document detection
   */
  static async scanDocument(): Promise<ScanResult> {
    try {
      // Request camera permission first
      const hasPermission = await this.requestCameraPermission();
      if (!hasPermission) {
        Alert.alert(
          "Camera Permission Required",
          "Please enable camera permission to scan receipts",
          [{ text: "OK" }]
        );
        return {
          scannedImages: [],
          status: "error",
          message: "Camera permission denied",
        };
      }

      const { scannedImages, status } = await DocumentScanner.scanDocument({
        maxNumDocuments: 1,
        croppedImageQuality: 100,
      });

      if (status === "success" && scannedImages && scannedImages.length > 0) {
        return {
          scannedImages,
          status: "success",
        };
      } else if (status === "cancel") {
        return {
          scannedImages: [],
          status: "cancelled",
          message: "Document scanning was cancelled",
        };
      } else {
        return {
          scannedImages: [],
          status: "error",
          message: "Failed to scan document",
        };
      }
    } catch (error: any) {
      console.error("Document scanning error:", error);
      return {
        scannedImages: [],
        status: "error",
        message: error.message || "Document scanning failed",
      };
    }
  }

  /**
   * Convert image URI to base64 string
   */
  static async convertImageToBase64(imageUri: string): Promise<string> {
    try {
      // For React Native, we can use fetch to get the image as blob
      const response = await fetch(imageUri);
      const blob = await response.blob();

      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          // Remove the data:image/jpeg;base64, prefix
          const base64Data = base64String.split(",")[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error: any) {
      console.error("Base64 conversion error:", error);
      throw new Error("Failed to convert image to base64");
    }
  }

  /**
   * Complete scan workflow: scan document and convert to base64
   */
  static async scanDocumentWithOCR(): Promise<{
    success: boolean;
    imageBase64?: string;
    originalUri?: string;
    message?: string;
  }> {
    try {
      // Step 1: Scan the document
      const scanResult = await this.scanDocument();

      if (
        scanResult.status !== "success" ||
        scanResult.scannedImages.length === 0
      ) {
        return {
          success: false,
          message: scanResult.message || "Failed to scan document",
        };
      }

      // Step 2: Convert to base64
      const imageUri = scanResult.scannedImages[0];
      const imageBase64 = await this.convertImageToBase64(imageUri);

      return {
        success: true,
        imageBase64,
        originalUri: imageUri,
        message: "Document scanned successfully",
      };
    } catch (error: any) {
      console.error("Scan workflow error:", error);
      return {
        success: false,
        message: error.message || "Scan workflow failed",
      };
    }
  }

  /**
   * Check if document scanner is available
   */
  static async isAvailable(): Promise<boolean> {
    try {
      // Try to access DocumentScanner to check availability
      return typeof DocumentScanner.scanDocument === "function";
    } catch (error) {
      console.error("Scanner availability check failed:", error);
      return false;
    }
  }

  /**
   * Get scanner configuration options
   */
  static getDefaultScanConfig() {
    return {
      maxNumDocuments: 1,
      letUserAdjustCrop: true,
      croppedImageQuality: 100,
      responseType: "imageFilePath" as const,
    };
  }
}
