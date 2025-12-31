// src/utils/colorUtils.ts
import sharp from "sharp";
import s3 from "../config/s3";

// HEX를 RGB로 변환
export const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
};

// RGB를 HEX로 변환
export const rgbToHex = (r: number, g: number, b: number): string => {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

// 두 색상 간의 유사도 계산 (0-100, 100이 완전 동일)
export const colorSimilarity = (
  color1: { r: number; g: number; b: number },
  color2: { r: number; g: number; b: number }
): number => {
  const rDiff = Math.abs(color1.r - color2.r);
  const gDiff = Math.abs(color1.g - color2.g);
  const bDiff = Math.abs(color1.b - color2.b);

  // 유클리드 거리 계산
  const distance = Math.sqrt(rDiff ** 2 + gDiff ** 2 + bDiff ** 2);
  const maxDistance = Math.sqrt(255 ** 2 + 255 ** 2 + 255 ** 2); // ~441

  // 유사도로 변환 (0-100)
  const similarity = ((maxDistance - distance) / maxDistance) * 100;
  return similarity;
};

// S3 URL에서 bucket과 key 추출
const parseS3Url = (s3Url: string): { bucket: string; key: string } => {
  // https://blendee-image-upload.s3.ap-northeast-2.amazonaws.com/images/xxx.jpg
  // 또는 https://s3.ap-northeast-2.amazonaws.com/blendee-image-upload/images/xxx.jpg
  
  const urlPatterns = [
    // Pattern 1: bucket.s3.region.amazonaws.com/key
    /https?:\/\/([^.]+)\.s3\.([^.]+)\.amazonaws\.com\/(.+)/,
    // Pattern 2: s3.region.amazonaws.com/bucket/key
    /https?:\/\/s3\.([^.]+)\.amazonaws\.com\/([^/]+)\/(.+)/,
  ];

  for (const pattern of urlPatterns) {
    const match = s3Url.match(pattern);
    if (match) {
      if (pattern === urlPatterns[0]) {
        return { bucket: match[1], key: match[3] };
      } else {
        return { bucket: match[2], key: match[3] };
      }
    }
  }

  throw new Error("Invalid S3 URL format");
};

// S3에서 직접 이미지 다운로드
const downloadImageFromS3 = async (s3Url: string): Promise<Buffer> => {
  try {
    const { bucket, key } = parseS3Url(s3Url);
    console.log("Downloading from S3:", { bucket, key });

    const params = {
      Bucket: bucket,
      Key: key,
    };

    const data = await s3.getObject(params).promise();
    
    if (!data.Body) {
      throw new Error("No image data received from S3");
    }

    return data.Body as Buffer;
  } catch (error: any) {
    console.error("S3 download error:", error.message);
    throw new Error(`Failed to download image from S3: ${error.message}`);
  }
};

// 이미지에서 주요 색상 추출
export const extractDominantColor = async (
  imageUrl: string
): Promise<{ hex: string; rgb: { r: number; g: number; b: number }; percentage: number }> => {
  try {
    console.log("Extracting color from:", imageUrl);
    
    // S3에서 직접 이미지 다운로드
    const imageBuffer = await downloadImageFromS3(imageUrl);
    console.log("Image downloaded, size:", imageBuffer.length, "bytes");

    // Sharp로 이미지 분석
    const { data, info } = await sharp(imageBuffer)
      .resize(100, 100, { fit: "inside" }) // 성능을 위해 리사이징
      .raw()
      .toBuffer({ resolveWithObject: true });

    console.log("Image processed:", info.width, "x", info.height, "channels:", info.channels);

    // 색상 빈도 계산
    const colorMap = new Map<string, number>();
    const pixelCount = info.width * info.height;
    const channels = info.channels; // RGB = 3, RGBA = 4

    for (let i = 0; i < data.length; i += channels) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // 색상을 HEX로 변환
      const hex = rgbToHex(r, g, b);
      colorMap.set(hex, (colorMap.get(hex) || 0) + 1);
    }

    console.log("Total unique colors:", colorMap.size);

    // 가장 많이 나타난 색상 찾기
    let dominantColor = { hex: "#000000", count: 0 };
    for (const [hex, count] of colorMap.entries()) {
      if (count > dominantColor.count) {
        dominantColor = { hex, count };
      }
    }

    const percentage = (dominantColor.count / pixelCount) * 100;
    const rgb = hexToRgb(dominantColor.hex);

    console.log("Dominant color:", dominantColor.hex, "percentage:", percentage.toFixed(2) + "%");

    return {
      hex: dominantColor.hex,
      rgb,
      percentage,
    };
  } catch (error: any) {
    console.error("Error extracting color:", error.message);
    throw new Error(`Failed to extract color from image: ${error.message}`);
  }
};

// 색상 검증 (±10% 오차 범위, 80% 이상 차지)
export const validateColor = async (
  imageUrl: string,
  targetColorHex: string
): Promise<{
  isValid: boolean;
  dominantColor: string;
  targetColor: string;
  similarity: number;
  percentage: number;
  reason?: string;
}> => {
  try {
    const { hex: dominantHex, rgb: dominantRgb, percentage } = 
      await extractDominantColor(imageUrl);
    
    const targetRgb = hexToRgb(targetColorHex);
    const similarity = colorSimilarity(dominantRgb, targetRgb);

    console.log("Color validation:");
    console.log("  Target:", targetColorHex, targetRgb);
    console.log("  Dominant:", dominantHex, dominantRgb);
    console.log("  Similarity:", similarity.toFixed(2) + "%");
    console.log("  Coverage:", percentage.toFixed(2) + "%");

    // 검증 조건
    const isSimilar = similarity >= 90; // 90% 이상 유사 (±10% 오차)
    const isEnough = percentage >= 80; // 80% 이상 차지

    let reason = "";
    if (!isSimilar) {
      reason = `Color mismatch: ${similarity.toFixed(1)}% similar (need 90%+)`;
    } else if (!isEnough) {
      reason = `Not enough coverage: ${percentage.toFixed(1)}% (need 80%+)`;
    }

    return {
      isValid: isSimilar && isEnough,
      dominantColor: dominantHex,
      targetColor: targetColorHex,
      similarity,
      percentage,
      reason: reason || undefined,
    };
  } catch (error: any) {
    console.error("Color validation error:", error);
    throw error;
  }
};