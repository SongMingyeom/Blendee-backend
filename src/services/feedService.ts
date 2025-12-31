// src/services/feedService.ts
import prisma from "../config/prisma";

// Canvas를 피드에 등록
export const createFeedPost = async (canvasId: number, userId: number) => {
  // Canvas 확인
  const canvas = await prisma.canvas.findUnique({
    where: { id: canvasId },
    include: {
      feedPost: true,
      blocks: {
        include: {
          filledPhoto: true,
        },
      },
    },
  });

  if (!canvas) {
    throw new Error("Canvas not found");
  }

  // Canvas 생성자만 피드에 등록 가능
  if (canvas.createdBy !== userId) {
    throw new Error("Only canvas creator can create feed post");
  }

  // Canvas가 완료되었는지 확인
  if (canvas.status !== "COMPLETED") {
    throw new Error("Canvas must be completed before posting to feed");
  }

  // 이미 피드에 등록되었는지 확인
  if (canvas.feedPost) {
    throw new Error("Canvas is already posted to feed");
  }

  // 모든 블록이 채워졌는지 재확인
  const allFilled = canvas.blocks.every(
    (block) => block.isFilled && block.filledPhoto?.isAccepted
  );
  if (!allFilled) {
    throw new Error("All blocks must be filled and accepted");
  }

  // 최종 이미지 URL 생성 (실제로는 블록들을 합성한 이미지)
  // 여기서는 임시로 첫 번째 사진 URL 사용
  const finalImageUrl =
    canvas.blocks[0]?.filledPhoto?.photoUrl || "placeholder.jpg";

  // 피드 포스트 생성
  const feedPost = await prisma.feedPost.create({
    data: {
      canvasId,
      finalImageUrl,
    },
  });

  return feedPost;
};

// 피드 목록 조회 (최신순)
export const getFeedPosts = async (page: number = 1, limit: number = 20) => {
  const skip = (page - 1) * limit;

  const [posts, total] = await Promise.all([
    prisma.feedPost.findMany({
      skip,
      take: limit,
      include: {
        canvas: {
          include: {
            creator: {
              select: {
                id: true,
                username: true,
                profileImageUrl: true,
              },
            },
            participants: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    profileImageUrl: true,
                  },
                },
              },
            },
            blocks: {
              select: {
                id: true,
                hexColor: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.feedPost.count(),
  ]);

  return {
    posts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// 피드 상세 조회
export const getFeedPostById = async (postId: number) => {
  const post = await prisma.feedPost.findUnique({
    where: { id: postId },
    include: {
      canvas: {
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              profileImageUrl: true,
            },
          },
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  profileImageUrl: true,
                },
              },
            },
          },
          blocks: {
            include: {
              filledPhoto: true,
              filledByUser: {
                select: {
                  id: true,
                  username: true,
                  profileImageUrl: true,
                },
              },
            },
            orderBy: {
              orderIndex: "asc",
            },
          },
        },
      },
    },
  });

  if (!post) {
    throw new Error("Feed post not found");
  }

  return post;
};

// 내 피드 포스트 목록
export const getMyFeedPosts = async (userId: number) => {
  const posts = await prisma.feedPost.findMany({
    where: {
      canvas: {
        OR: [
          { createdBy: userId },
          {
            participants: {
              some: {
                userId,
              },
            },
          },
        ],
      },
    },
    include: {
      canvas: {
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              profileImageUrl: true,
            },
          },
          participants: {
            select: {
              userId: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return posts;
};

// 피드 포스트 삭제 (Canvas 생성자만)
export const deleteFeedPost = async (postId: number, userId: number) => {
  const post = await prisma.feedPost.findUnique({
    where: { id: postId },
    include: {
      canvas: true,
    },
  });

  if (!post) {
    throw new Error("Feed post not found");
  }

  if (post.canvas.createdBy !== userId) {
    throw new Error("Only canvas creator can delete feed post");
  }

  await prisma.feedPost.delete({
    where: { id: postId },
  });

  return { message: "Feed post deleted successfully" };
};