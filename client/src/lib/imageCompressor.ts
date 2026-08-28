/**
 * 클라이언트단 이미지 자동 리사이징 & 압축 유틸리티
 * 
 * - 최대 가로폭 1600px 제한 (비율 유지)
 * - WebP (또는 JPEG) 85% 퀄리티 압축
 * - 10MB 원본 사진을 300~500KB 수준의 고화질 웹 최적화 이미지로 압축
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: "image/webp" | "image/jpeg";
}

export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const {
    maxWidth = 1600,
    maxHeight = 1600,
    quality = 0.85,
    format = "image/webp",
  } = options;

  // GIF나 SVG 등 벡터/애니메이션은 압축하지 않고 원본 유지
  if (file.type === "image/gif" || file.type === "image/svg+xml") {
    return file;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      if (!e.target?.result) {
        return resolve(file);
      }
      img.src = e.target.result as string;
    };

    reader.onerror = () => resolve(file);

    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // 최대 해상도 비율 축소 계산
      if (width > maxWidth || height > maxHeight) {
        if (width / height > maxWidth / maxHeight) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return resolve(file);
      }

      // 부드러운 리샘플링 렌더링
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            return resolve(file);
          }

          // 확장자 및 파일명 재구성
          const extension = format === "image/webp" ? ".webp" : ".jpg";
          const newName = file.name.replace(/\.[^/.]+$/, "") + extension;

          const compressedFile = new File([blob], newName, {
            type: format,
            lastModified: Date.now(),
          });

          // 압축본이 원본보다 작을 때만 압축본 사용
          if (compressedFile.size < file.size) {
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        },
        format,
        quality
      );
    };

    img.onerror = () => resolve(file);

    reader.readAsDataURL(file);
  });
}
