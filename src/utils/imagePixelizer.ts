// src/utils/imagePixelizer.ts
import sharp from "sharp";
import s3 from "../config/s3";

interface ColorBlock {
  orderIndex: number;
  hexColor: string;
  position: {
    row: number;
    col: number;
  };
}

// S3에서 이미지 다운로드
const downloadImageFromS3 = async (s3Url: string): Promise<Buffer> => {
  const urlPattern = /https?:\/\/([^.]+)\.s3\.([^.]+)\.amazonaws\.com\/(.+)/;
  const match = s3Url.match(urlPattern);

  if (!match) {
    throw new Error("Invalid S3 URL format");
  }

  const [, bucket, , key] = match;

  const params = {
    Bucket: bucket,
    Key: key,
  };

  const data = await s3.getObject(params).promise();

  if (!data.Body) {
    throw new Error("No image data received from S3");
  }

  return data.Body as Buffer;
};

// RGB를 HEX로 변환
const rgbToHex = (r: number, g: number, b: number): string => {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
};

// 이미지를 그리드로 분할하고 각 블록의 대표 색상 추출
export const pixelizeImage = async (
  imageUrl: string,
  gridSize: number = 16 // 16, 64, 128
): Promise<ColorBlock[]> => {
  try {
    console.log(`Pixelizing image: ${imageUrl} with ${gridSize} blocks`);

    // 그리드 계산 (16 = 4x4, 64 = 8x8, 128 = 16x8 또는 조정 가능)
    const gridDimensions = getGridDimensions(gridSize);
    const rows = gridDimensions.rows;
    const cols = gridDimensions.cols;

    // S3에서 이미지 다운로드
    const imageBuffer = await downloadImageFromS3(imageUrl);

    // 이미지 메타데이터 가져오기
    const metadata = await sharp(imageBuffer).metadata();
    const imageWidth = metadata.width!;
    const imageHeight = metadata.height!;

    console.log(`Image size: ${imageWidth}x${imageHeight}`);
    console.log(`Grid: ${rows}x${cols}`);

    // 블록 크기 계산
    const blockWidth = Math.floor(imageWidth / cols);
    const blockHeight = Math.floor(imageHeight / rows);

    const colorBlocks: ColorBlock[] = [];
    let orderIndex = 0;

    // 각 블록을 순회하며 대표 색상 추출
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        // 블록 영역 계산
        const left = col * blockWidth;
        const top = row * blockHeight;

        // 블록 추출
        const blockBuffer = await sharp(imageBuffer)
          .extract({
            left,
            top,
            width: blockWidth,
            height: blockHeight,
          })
          .resize(10, 10) // 성능을 위해 작게 리사이징
          .raw()
          .toBuffer({ resolveWithObject: true });

        // 평균 색상 계산
        const { data, info } = blockBuffer;
        let totalR = 0,
          totalG = 0,
          totalB = 0;
        const pixelCount = info.width * info.height;

        for (let i = 0; i < data.length; i += info.channels) {
          totalR += data[i];
          totalG += data[i + 1];
          totalB += data[i + 2];
        }

        const avgR = Math.round(totalR / pixelCount);
        const avgG = Math.round(totalG / pixelCount);
        const avgB = Math.round(totalB / pixelCount);

        const hexColor = rgbToHex(avgR, avgG, avgB);

        colorBlocks.push({
          orderIndex,
          hexColor,
          position: { row, col },
        });

        orderIndex++;
      }
    }

    console.log(`Extracted ${colorBlocks.length} color blocks`);
    return colorBlocks;
  } catch (error: any) {
    console.error("Pixelization error:", error);
    throw new Error(`Failed to pixelize image: ${error.message}`);
  }
};

// 그리드 크기 결정
const getGridDimensions = (
  gridSize: number
): { rows: number; cols: number } => {
  switch (gridSize) {
    case 16:
      return { rows: 4, cols: 4 };
    case 64:
      return { rows: 8, cols: 8 };
    case 128:
      return { rows: 16, cols: 8 }; // 16:9 비율로 조정 가능
    default:
      throw new Error("Invalid grid size. Use 16, 64, or 128");
  }
};