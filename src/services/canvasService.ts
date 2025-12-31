// src/services/canvasService.ts
import prisma from "../config/prisma";
import { CanvasStatus } from "@prisma/client";
import bcrypt from "bcrypt";
import { pixelizeImage } from "../utils/imagePixelizer";

// 랜덤 6자리 룸코드 생성
const generateRoomCode = (): string => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
};

// Canvas 생성 - 이미지 자동 픽셀화
export const createCanvas = async (
  userId: number,
  options: {
    title?: string;
    description?: string;
    hashtags?: string[];
    sourceImageUrl: string;
    blockCount?: number;
    isPublic?: boolean;
    password?: string;
    timeLimit?: number;
  }
) => {
  const {
    title,
    description,
    hashtags,
    sourceImageUrl,
    blockCount = 16,
    isPublic = true,
    password,
    timeLimit,
  } = options;

  if (!isPublic && !password) {
    throw new Error("Private canvas requires a password");
  }

  let hashedPassword = null;
  if (password) {
    hashedPassword = await bcrypt.hash(password, 10);
  }

  let endDate = null;
  if (timeLimit && timeLimit > 0) {
    endDate = new Date();
    endDate.setHours(endDate.getHours() + timeLimit);
  }

  let roomCode = generateRoomCode();
  let existing = await prisma.canvas.findUnique({ where: { roomCode } });

  while (existing) {
    roomCode = generateRoomCode();
    existing = await prisma.canvas.findUnique({ where: { roomCode } });
  }

  // 이미지 픽셀화
  console.log("Starting image pixelization...");
  const colorBlocks = await pixelizeImage(sourceImageUrl, blockCount);

  // Canvas 생성
  const canvas = await prisma.canvas.create({
    data: {
      roomCode,
      title: title || "제목 없음",
      description,
      hashtags: hashtags || [],
      sourceImageUrl,
      createdBy: userId,
      status: CanvasStatus.OPEN,
      isPublic,
      password: hashedPassword,
      startDate: new Date(),
      endDate,
    },
  });

  // CanvasBlock 생성
  const blocks = colorBlocks.map((block) => ({
    canvasId: canvas.id,
    hexColor: block.hexColor,
    orderIndex: block.orderIndex,
    isFilled: false,
  }));

  await prisma.canvasBlock.createMany({ data: blocks });

  console.log(`Canvas created with ${blocks.length} blocks`);

  return {
    id: canvas.id,
    roomCode: canvas.roomCode,
    title: canvas.title,
    description: canvas.description,
    hashtags: canvas.hashtags,
    status: canvas.status,
    isPublic: canvas.isPublic,
    blockCount: blocks.length,
    sourceImageUrl: canvas.sourceImageUrl,
    startDate: canvas.startDate,
    endDate: canvas.endDate,
    createdAt: canvas.createdAt,
  };
};

// Canvas 참여 - 랜덤/선택/추천
export const joinCanvas = async (
  userId: number,
  roomCode: string,
  options: {
    password?: string;
    assignmentType: "random" | "select" | "recommend";
    selectedColor?: string;
  }
) => {
  const { password, assignmentType, selectedColor } = options;

  const canvas = await prisma.canvas.findUnique({
    where: { roomCode },
    include: {
      participants: true,
      blocks: {
        where: { isFilled: false },
      },
    },
  });

  if (!canvas) {
    throw new Error("Canvas not found");
  }

  if (!canvas.isPublic) {
    if (!password) {
      throw new Error("Password required for private canvas");
    }
    if (!canvas.password) {
      throw new Error("Canvas password not set");
    }
    const isPasswordValid = await bcrypt.compare(password, canvas.password);
    if (!isPasswordValid) {
      throw new Error("Incorrect password");
    }
  }

  if (canvas.status !== CanvasStatus.OPEN) {
    throw new Error("Canvas is already completed");
  }

  const now = new Date();
  if (canvas.endDate && now > canvas.endDate) {
    throw new Error("Canvas participation period has ended");
  }

  const alreadyJoined = canvas.participants.find((p) => p.userId === userId);
  if (alreadyJoined) {
    throw new Error("Already joined this canvas");
  }

  if (canvas.blocks.length === 0) {
    throw new Error("No available blocks");
  }

  // 블록 배정 로직
  let assignedColor: string;

  switch (assignmentType) {
    case "random":
      const randomIndex = Math.floor(Math.random() * canvas.blocks.length);
      assignedColor = canvas.blocks[randomIndex].hexColor;
      break;

    case "select":
      if (!selectedColor) {
        throw new Error("Selected color is required for 'select' mode");
      }
      const selectedBlock = canvas.blocks.find(
        (b) => b.hexColor === selectedColor
      );
      if (!selectedBlock) {
        throw new Error("Selected color is not available");
      }
      assignedColor = selectedColor;
      break;

    case "recommend":
      const colorCounts = new Map<string, number>();
      canvas.blocks.forEach((block) => {
        colorCounts.set(
          block.hexColor,
          (colorCounts.get(block.hexColor) || 0) + 1
        );
      });
      const sortedColors = Array.from(colorCounts.entries()).sort(
        (a, b) => b[1] - a[1]
      );
      assignedColor = sortedColors[0][0];
      break;

    default:
      throw new Error("Invalid assignment type");
  }

  const totalBlocks = canvas.blocks.length;
  const participantCount = canvas.participants.length + 1;
  const blocksPerUser = Math.floor(totalBlocks / participantCount);

  await prisma.roomParticipation.create({
    data: {
      canvasId: canvas.id,
      userId,
      blockColor: assignedColor,
      assignedBlocks: blocksPerUser,
    },
  });

  return {
    canvasId: canvas.id,
    roomCode: canvas.roomCode,
    assignedBlocks: blocksPerUser,
    blockColor: assignedColor,
    assignmentType,
  };
};

// 사용 가능한 색상 목록
export const getAvailableColors = async (canvasId: number) => {
  const blocks = await prisma.canvasBlock.findMany({
    where: {
      canvasId,
      isFilled: false,
    },
    select: {
      hexColor: true,
    },
  });

  const colorMap = new Map<string, number>();
  blocks.forEach((block) => {
    colorMap.set(block.hexColor, (colorMap.get(block.hexColor) || 0) + 1);
  });

  return Array.from(colorMap.entries()).map(([color, count]) => ({
    hexColor: color,
    availableCount: count,
  }));
};

// Canvas 상세 조회
export const getCanvasById = async (canvasId: number, userId?: number) => {
  const canvas = await prisma.canvas.findUnique({
    where: { id: canvasId },
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
            },
          },
        },
        orderBy: {
          orderIndex: "asc",
        },
      },
    },
  });

  if (!canvas) {
    throw new Error("Canvas not found");
  }

  let myParticipation = null;
  if (userId) {
    myParticipation = canvas.participants.find((p) => p.userId === userId);
  }

  return {
    ...canvas,
    myParticipation,
    password: undefined,
  };
};

// 내 Canvas 목록
export const getMyCanvases = async (userId: number) => {
  const canvases = await prisma.canvas.findMany({
    where: {
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
            },
          },
        },
      },
      blocks: {
        select: {
          id: true,
          hexColor: true,
          isFilled: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return canvases.map((canvas) => {
    const totalBlocks = canvas.blocks.length;
    const filledBlocks = canvas.blocks.filter((b) => b.isFilled).length;
    const remainingBlocks = totalBlocks - filledBlocks;
    const progress = totalBlocks > 0 ? (filledBlocks / totalBlocks) * 100 : 0;

    const unfilledBlocks = canvas.blocks.filter((b) => !b.isFilled);
    const neededColors = [...new Set(unfilledBlocks.map((b) => b.hexColor))];

    let remainingTime = null;
    if (canvas.endDate) {
      const now = new Date();
      const diff = canvas.endDate.getTime() - now.getTime();

      if (diff > 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        remainingTime = `${hours}h ${minutes}m`;
      } else {
        remainingTime = "종료됨";
      }
    }

    return {
      id: canvas.id,
      roomCode: canvas.roomCode,
      title: canvas.title || "제목 없음",
      description: canvas.description,
      hashtags: canvas.hashtags,
      status: canvas.status,
      isPublic: canvas.isPublic,
      startDate: canvas.startDate,
      endDate: canvas.endDate,
      remainingTime,
      createdAt: canvas.createdAt,
      creator: canvas.creator,
      participantCount: canvas.participants.length,
      progress: Math.round(progress),
      totalBlocks,
      filledBlocks,
      remainingBlocks,
      neededColors: neededColors.slice(0, 3),
    };
  });
};

// 공개 Canvas 목록
export const getPublicCanvases = async (
  page: number = 1,
  limit: number = 20
) => {
  const skip = (page - 1) * limit;

  const [canvases, total] = await Promise.all([
    prisma.canvas.findMany({
      where: {
        isPublic: true,
        status: CanvasStatus.OPEN,
      },
      skip,
      take: limit,
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
        blocks: {
          select: {
            id: true,
            isFilled: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.canvas.count({
      where: {
        isPublic: true,
        status: CanvasStatus.OPEN,
      },
    }),
  ]);

  return {
    canvases: canvases.map((canvas) => {
      const totalBlocks = canvas.blocks.length;
      const filledBlocks = canvas.blocks.filter((b) => b.isFilled).length;
      const progress =
        totalBlocks > 0 ? (filledBlocks / totalBlocks) * 100 : 0;

      return {
        id: canvas.id,
        roomCode: canvas.roomCode,
        creator: canvas.creator,
        participantCount: canvas.participants.length,
        progress: Math.round(progress),
        totalBlocks,
        filledBlocks,
        startDate: canvas.startDate,
        endDate: canvas.endDate,
        createdAt: canvas.createdAt,
      };
    }),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// Canvas 완료
export const completeCanvas = async (canvasId: number, userId: number) => {
  const canvas = await prisma.canvas.findUnique({
    where: { id: canvasId },
    include: {
      blocks: true,
    },
  });

  if (!canvas) {
    throw new Error("Canvas not found");
  }

  if (canvas.createdBy !== userId) {
    throw new Error("Only canvas creator can complete it");
  }

  if (canvas.status === CanvasStatus.COMPLETED) {
    throw new Error("Canvas is already completed");
  }

  const allFilled = canvas.blocks.every((block) => block.isFilled);
  if (!allFilled) {
    throw new Error("Not all blocks are filled yet");
  }

  const updatedCanvas = await prisma.canvas.update({
    where: { id: canvasId },
    data: {
      status: CanvasStatus.COMPLETED,
    },
  });

  return updatedCanvas;
};


// 내가 촬영해야 할 블록 정보
export const getMyAssignedBlocks = async (userId: number, canvasId: number) => {
  // 내 참여 정보 확인
  const participation = await prisma.roomParticipation.findFirst({
    where: {
      userId,
      canvasId,
    },
  });

  if (!participation) {
    throw new Error("You are not a participant of this canvas");
  }

  // 내가 촬영해야 할 색상의 빈 블록들
  const myBlocks = await prisma.canvasBlock.findMany({
    where: {
      canvasId,
      hexColor: participation.blockColor,
      isFilled: false,
    },
    orderBy: {
      orderIndex: "asc",
    },
  });

  return {
    assignedColor: participation.blockColor,
    totalAssigned: participation.assignedBlocks,
    remainingBlocks: myBlocks.length,
    blocks: myBlocks,
  };
};