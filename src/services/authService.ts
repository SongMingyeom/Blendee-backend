import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../config/prisma";

export const registerUser = async (
  username: string,
  email: string,
  password: string
) => {
  const existing = await prisma.user.findUnique({
    where: { email },
  });
  if (existing) throw new Error("Email already exists");

  const hashed = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      username,
      email,
      passwordHash: hashed,
    },
  });
};

export const loginUser = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });
  if (!user) throw new Error("Invalid email or password");

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) throw new Error("Invalid email or password");

  const token = jwt.sign(
    { id: user.id },
    process.env.JWT_SECRET!,
    { expiresIn: "1d" }
  );

  return {
    token,
    username: user.username,
  };
};