// src/services/userService.ts
import prisma from "../config/prisma";

// 사용자 통계 조회
export const getUserStats = async (userId: number) => {
  // 1. 내가 연결된 컬러 수 (참여한 Canvas 수)
  const connectedColors = await prisma.roomParticipation.count({
    where: { userId },
  });

  // 2. 내가 완성한 사진 수 (승인된 사진 수)
  const completedPhotos = await prisma.photo.count({
    where: {
      userId,
      isAccepted: true,
    },
  });

  // 3. 내가 업로드한 게시물 수 (내가 생성한 Canvas 중 완료되어 피드에 올라간 것)
  const uploadedPosts = await prisma.feedPost.count({
    where: {
      canvas: {
        createdBy: userId,
      },
    },
  });

  return {
    connectedColors,
    completedPhotos,
    uploadedPosts,
  };
};

// 사용자 프로필 조회
export const getUserProfile = async (userId: number) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
      profileImageUrl: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // 통계도 함께 반환
  const stats = await getUserStats(userId);

  return {
    ...user,
    stats,
  };
};