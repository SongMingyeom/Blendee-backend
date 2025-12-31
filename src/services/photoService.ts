// src/services/photoService.ts (업데이트 버전)
import prisma from "../config/prisma";
import { validateColor } from "../utils/colorUtils";

// 사진 제출 (블록 채우기) - 자동 색상 검증 추가
export const submitPhoto = async (
  userId: number,
  canvasId: number,
  blockId: number,
  photoUrl: string,
  autoValidate: boolean = true // 자동 검증 옵션
) => {
  // Canvas 확인
  const canvas = await prisma.canvas.findUnique({
    where: { id: canvasId },
    include: {
      participants: true,
      blocks: true,
    },
  });

  if (!canvas) {
    throw new Error("Canvas not found");
  }

  if (canvas.status !== "OPEN") {
    throw new Error("Canvas is already completed");
  }

  // 참여자 확인
  const participation = canvas.participants.find((p) => p.userId === userId);
  if (!participation) {
    throw new Error("You are not a participant of this canvas");
  }

  // 블록 확인
  const block = canvas.blocks.find((b) => b.id === blockId);
  if (!block) {
    throw new Error("Block not found");
  }

  if (block.isFilled) {
    throw new Error("Block is already filled");
  }

  // 🎨 자동 색상 검증
  let colorValidation = null;
  let isAutoAccepted = false;

  if (autoValidate) {
    try {
      colorValidation = await validateColor(photoUrl, block.hexColor);
      
      if (!colorValidation.isValid) {
        throw new Error(
          `Color validation failed: ${colorValidation.reason}`
        );
      }
      
      // 색상 검증 통과 시 자동 승인
      isAutoAccepted = true;
    } catch (error: any) {
      throw new Error(`Color validation error: ${error.message}`);
    }
  }

  // 사진 생성
  const photo = await prisma.photo.create({
    data: {
      userId,
      canvasId,
      blockId,
      photoUrl,
      isAccepted: isAutoAccepted, // 자동 검증 통과 시 바로 승인
    },
  });

  // 블록 정보 업데이트
  await prisma.canvasBlock.update({
    where: { id: blockId },
    data: {
      filledByUserId: userId,
      filledPhotoId: photo.id,
      isFilled: isAutoAccepted, // 자동 승인 시 바로 채움
    },
  });

  // 자동 승인된 경우 UserCanvas에도 기록
  if (isAutoAccepted) {
    await prisma.userCanvas.create({
      data: {
        userId,
        photoId: photo.id,
        blockColor: block.hexColor,
      },
    });
  }

  return {
    photo,
    colorValidation,
    autoAccepted: isAutoAccepted,
  };
};

// 사진 승인 (수동)
export const acceptPhoto = async (photoId: number, userId: number) => {
  const photo = await prisma.photo.findUnique({
    where: { id: photoId },
    include: {
      canvas: true,
      block: true,
    },
  });

  if (!photo) {
    throw new Error("Photo not found");
  }

  // Canvas 생성자만 승인 가능
  if (photo.canvas.createdBy !== userId) {
    throw new Error("Only canvas creator can accept photos");
  }

  if (photo.isAccepted) {
    throw new Error("Photo is already accepted");
  }

  // 사진 승인 & 블록 채우기
  const updatedPhoto = await prisma.photo.update({
    where: { id: photoId },
    data: {
      isAccepted: true,
    },
  });

  await prisma.canvasBlock.update({
    where: { id: photo.blockId },
    data: {
      isFilled: true,
    },
  });

  // UserCanvas에 기록 (개인 갤러리용)
  await prisma.userCanvas.create({
    data: {
      userId: photo.userId,
      photoId: photo.id,
      blockColor: photo.block.hexColor,
    },
  });

  return updatedPhoto;
};

// 사진 거부
export const rejectPhoto = async (photoId: number, userId: number) => {
  const photo = await prisma.photo.findUnique({
    where: { id: photoId },
    include: {
      canvas: true,
    },
  });

  if (!photo) {
    throw new Error("Photo not found");
  }

  // Canvas 생성자만 거부 가능
  if (photo.canvas.createdBy !== userId) {
    throw new Error("Only canvas creator can reject photos");
  }

  if (photo.isAccepted) {
    throw new Error("Cannot reject an accepted photo");
  }

  // 블록 정보 초기화
  await prisma.canvasBlock.update({
    where: { id: photo.blockId },
    data: {
      filledByUserId: null,
      filledPhotoId: null,
      isFilled: false,
    },
  });

  // 사진 삭제
  await prisma.photo.delete({
    where: { id: photoId },
  });

  return { message: "Photo rejected and removed" };
};

// Canvas의 대기 중인 사진 목록
export const getPendingPhotos = async (canvasId: number, userId: number) => {
  // Canvas 확인 및 권한 체크
  const canvas = await prisma.canvas.findUnique({
    where: { id: canvasId },
  });

  if (!canvas) {
    throw new Error("Canvas not found");
  }

  if (canvas.createdBy !== userId) {
    throw new Error("Only canvas creator can view pending photos");
  }

  // 승인 대기 중인 사진들
  const photos = await prisma.photo.findMany({
    where: {
      canvasId,
      isAccepted: false,
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          profileImageUrl: true,
        },
      },
      block: {
        select: {
          id: true,
          hexColor: true,
          orderIndex: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return photos;
};

// 내가 제출한 사진 목록
export const getMyPhotos = async (userId: number) => {
  const photos = await prisma.photo.findMany({
    where: { userId },
    include: {
      canvas: {
        select: {
          id: true,
          roomCode: true,
          status: true,
        },
      },
      block: {
        select: {
          hexColor: true,
          orderIndex: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return photos;
};

// 내 갤러리 (승인된 사진들)
export const getMyGallery = async (userId: number) => {
  const gallery = await prisma.userCanvas.findMany({
    where: { userId },
    include: {
      photo: {
        include: {
          canvas: {
            select: {
              id: true,
              roomCode: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return gallery;
};