// src/services/authService.ts
import prisma from "../config/prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// 회원가입
export const register = async (
  username: string,
  email: string,
  password: string
) => {
  // 이메일 중복 확인
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error("Email already exists");
  }

  // 비밀번호 해싱
  const passwordHash = await bcrypt.hash(password, 10);

  // 사용자 생성
  const user = await prisma.user.create({
    data: {
      username,
      email,
      passwordHash,
    },
  });

  // JWT 토큰 생성
  const token = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET || "blendee_secret_key",
    { expiresIn: "7d" }
  );

  // 비밀번호 제외하고 반환
  return {
    success: true,
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      profileImageUrl: user.profileImageUrl,
      createdAt: user.createdAt,
    },
  };
};

// 로그인
export const login = async (email: string, password: string) => {
  // 사용자 찾기
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  // 비밀번호 확인
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    throw new Error("Invalid email or password");
  }

  // JWT 토큰 생성
  const token = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET || "blendee_secret_key",
    { expiresIn: "7d" }
  );

  // 비밀번호 제외하고 반환
  return {
    success: true,
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      profileImageUrl: user.profileImageUrl,
      createdAt: user.createdAt,
    },
  };
};

// 비밀번호 재설정 요청
export const requestPasswordReset = async (email: string) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    // 보안상 이유로 사용자가 없어도 성공 응답
    return {
      success: true,
      message: "If the email exists, a reset link has been sent",
    };
  }

  // 리셋 토큰 생성 (1시간 유효)
  const resetToken = jwt.sign(
    { id: user.id, purpose: "password-reset" },
    process.env.JWT_SECRET || "blendee_secret_key",
    { expiresIn: "1h" }
  );

  // TODO: 실제로는 이메일 전송 서비스 사용
  // 예: SendGrid, AWS SES, Nodemailer 등
  console.log(`Password reset token for ${email}: ${resetToken}`);
  console.log(`Reset link: http://localhost:3000/reset-password?token=${resetToken}`);

  return {
    success: true,
    message: "If the email exists, a reset link has been sent",
    // 개발 환경에서만 토큰 반환 (프로덕션에서는 제거!)
    ...(process.env.NODE_ENV === "development" && { resetToken }),
  };
};

// 비밀번호 재설정
export const resetPassword = async (token: string, newPassword: string) => {
  try {
    // 토큰 검증
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "blendee_secret_key"
    ) as { id: number; purpose: string };

    if (decoded.purpose !== "password-reset") {
      throw new Error("Invalid token purpose");
    }

    // 새 비밀번호 해싱
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // 비밀번호 업데이트
    await prisma.user.update({
      where: { id: decoded.id },
      data: { passwordHash },
    });

    return {
      success: true,
      message: "Password reset successfully",
    };
  } catch (error) {
    throw new Error("Invalid or expired reset token");
  }
};