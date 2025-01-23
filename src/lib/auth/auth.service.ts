import { User, UserModel } from '@/models/user.model';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

export const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  role: z.enum(['USER', 'ADMIN']).default('USER'),
  twoFactorEnabled: z.boolean().default(false),
});

export type CreateUserInput = z.infer<typeof userSchema>;

export async function createUser(input: CreateUserInput): Promise<User> {
  const hashedPassword = await bcrypt.hash(input.password, 12);
  
  const user = await UserModel.create({
    ...input,
    password: hashedPassword,
  });

  return user;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  return UserModel.findOne({ email });
}

export async function getUserById(id: string): Promise<User | null> {
  return UserModel.findById(id);
}

export async function updateUser(
  id: string,
  data: Partial<CreateUserInput>
): Promise<User | null> {
  if (data.password) {
    data.password = await bcrypt.hash(data.password, 12);
  }
  
  return UserModel.findByIdAndUpdate(id, data, { new: true });
}

export async function enableTwoFactor(id: string): Promise<User | null> {
  return UserModel.findByIdAndUpdate(
    id,
    { twoFactorEnabled: true },
    { new: true }
  );
}

export async function verifyPassword(
  hashedPassword: string,
  password: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
} 