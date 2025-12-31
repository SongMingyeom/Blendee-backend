// src/services/canvasService.ts
import prisma from "../config/prisma";
import { CanvasStatus } from "@prisma/client";
import bcrypt from "bcrypt";

// 랜덤 6자리 룸코드 생성
const generateRoomCode = (): string => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
};

// Canvas 생성 - 공개/비공개, 비밀번호, 기간 설정 추가
export const createCanvas = async (
  userId: number,
  options: {
    blockCount?: number;
    isPublic?: boolean;
    password?: string;
    startDate?: string;
    endDate?: string;
  } = {}
) => {
  const {
    blockCount = 16,
    isPublic = true,
    password,
    startDate,
    endDate,
  } = options;

  // 비공개 방인데 비밀번호 없으면 에러
  if (!isPublic && !password) {
    throw new Error("Private canvas requires a password");
  }

  // 비밀번호 해싱
  let hashedPassword = null;
  if (password) {
    hashedPassword = await bcrypt.hash(password, 10);
  }

  // 고유한 룸코드 생성
  let roomCode = generateRoomCode();
  let existing = await prisma.canvas.findUnique({ where: { roomCode } });

  while (existing) {
    roomCode = generateRoomCode();
    existing = await prisma.canvas.findUnique({ where: { roomCode } });
  }

  // Canvas 생성
  const canvas = await prisma.canvas.create({
    data: {
      roomCode,
      createdBy: userId,
      status: CanvasStatus.OPEN,
      isPublic,
      password: hashedPassword,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
    },
  });

  // CanvasBlock 생성 (기본 색상 팔레트)
  const colors = [
    "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A",
    "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E2",
    "#F8B88B", "#FAD7A0", "#AED6F1", "#D7BDE2",
    "#A9DFBF", "#F9E79F", "#FADBD8", "#D5F4E6"
  ];

  const blocks = [];
  for (let i = 0; i < blockCount; i++) {
    blocks.push({
      canvasId: canvas.id,
      hexColor: colors[i % colors.length],
      orderIndex: i,
      isFilled: false,
    });
  }

  await prisma.canvasBlock.createMany({ data: blocks });

  return {
    id: canvas.id,
    roomCode: canvas.roomCode,
    status: canvas.status,
    isPublic: canvas.isPublic,
    startDate: canvas.startDate,
    endDate: canvas.endDate,
    createdAt: canvas.createdAt,
  };
};

// Canvas 참여 - 비밀번호 검증 추가
export const joinCanvas = async (
  userId: number,
  roomCode: string,
  blockColor: string,
  password?: string
) => {
  // Canvas 존재 여부 확인
  const canvas = await prisma.canvas.findUnique({
    where: { roomCode },
    include: {
      participants: true,
      blocks: true,
    },
  });

  if (!canvas) {
    throw new Error("Canvas not found");
  }

  // 비공개 방인 경우 비밀번호 확인
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

  // 기간 확인
  const now = new Date();
  if (canvas.endDate && now > canvas.endDate) {
    throw new Error("Canvas participation period has ended");
  }

  // 이미 참여했는지 확인
  const alreadyJoined = canvas.participants.find((p) => p.userId === userId);
  if (alreadyJoined) {
    throw new Error("Already joined this canvas");
  }

  // 사용 가능한 블록 수 계산
  const totalBlocks = canvas.blocks.length;
  const participantCount = canvas.participants.length + 1; // 새 참가자 포함
  const blocksPerUser = Math.floor(totalBlocks / participantCount);

  // 참여 정보 생성
  const participation = await prisma.roomParticipation.create({
    data: {
      canvasId: canvas.id,
      userId,
      blockColor,
      assignedBlocks: blocksPerUser,
    },
  });

  return {
    canvasId: canvas.id,
    roomCode: canvas.roomCode,
    assignedBlocks: blocksPerUser,
    blockColor,
  };
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

  // 현재 사용자의 참여 정보
  let myParticipation = null;
  if (userId) {
    myParticipation = canvas.participants.find((p) => p.userId === userId);
  }

  return {
    ...canvas,
    myParticipation,
    password: undefined, // 비밀번호는 노출하지 않음
  };
};

// 내 Canvas 목록 조회
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
    const progress = totalBlocks > 0 ? (filledBlocks / totalBlocks) * 100 : 0;

    return {
      id: canvas.id,
      roomCode: canvas.roomCode,
      status: canvas.status,
      isPublic: canvas.isPublic,
      startDate: canvas.startDate,
      endDate: canvas.endDate,
      createdAt: canvas.createdAt,
      creator: canvas.creator,
      participantCount: canvas.participants.length,
      progress: Math.round(progress),
      totalBlocks,
      filledBlocks,
    };
  });
};

// 공개 Canvas 목록 조회
export const getPublicCanvases = async (page: number = 1, limit: number = 20) => {
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
      const progress = totalBlocks > 0 ? (filledBlocks / totalBlocks) * 100 : 0;

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

// Canvas 완료 처리
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

  // 모든 블록이 채워졌는지 확인
  const allFilled = canvas.blocks.every((block) => block.isFilled);
  if (!allFilled) {
    throw new Error("Not all blocks are filled yet");
  }

  // Canvas 완료 처리
  const updatedCanvas = await prisma.canvas.update({
    where: { id: canvasId },
    data: {
      status: CanvasStatus.COMPLETED,
    },
  });

  return updatedCanvas;
};