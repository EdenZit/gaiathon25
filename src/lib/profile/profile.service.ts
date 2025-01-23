import { User, UserModel } from '@/models/user.model';
import { z } from 'zod';
import crypto from 'crypto';
import { sendVerificationEmail, sendPasswordResetEmail } from '@/lib/email/email.service';

// Profile update validation schema
export const profileUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  profile: z.object({
    bio: z.string().max(500).optional(),
    location: z.string().optional(),
    website: z.string().url().optional(),
    socialLinks: z.object({
      twitter: z.string().optional(),
      github: z.string().optional(),
      linkedin: z.string().optional(),
    }).optional(),
  }).optional(),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

// Generate a secure random token
function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function updateProfile(
  userId: string,
  data: ProfileUpdateInput,
  ipAddress?: string,
  userAgent?: string
): Promise<User | null> {
  const user = await UserModel.findById(userId);
  if (!user) return null;

  // Update profile fields
  if (data.name) user.name = data.name;
  if (data.profile) {
    user.profile = {
      ...user.profile,
      ...data.profile,
    };
  }

  // Log activity
  await user.logActivity({
    type: 'PROFILE_UPDATE',
    ipAddress,
    userAgent,
  });

  return user.save();
}

export async function initiateEmailVerification(userId: string): Promise<boolean> {
  const user = await UserModel.findById(userId);
  if (!user || user.status.isVerified) return false;

  const token = generateToken();
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  user.status.verificationToken = token;
  user.status.verificationExpires = expires;
  await user.save();

  return sendVerificationEmail(user.email, token);
}

export async function verifyEmail(token: string): Promise<boolean> {
  const user = await UserModel.findOne({
    'status.verificationToken': token,
    'status.verificationExpires': { $gt: new Date() },
  });

  if (!user) return false;

  user.status.isVerified = true;
  user.status.verificationToken = undefined;
  user.status.verificationExpires = undefined;
  await user.save();

  return true;
}

export async function initiatePasswordReset(email: string): Promise<boolean> {
  const user = await UserModel.findOne({ email });
  if (!user) return false;

  const token = generateToken();
  const expires = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

  user.status.resetPasswordToken = token;
  user.status.resetPasswordExpires = expires;
  await user.save();

  return sendPasswordResetEmail(email, token);
}

export async function updateAvatar(
  userId: string,
  avatarUrl: string,
  ipAddress?: string,
  userAgent?: string
): Promise<User | null> {
  const user = await UserModel.findById(userId);
  if (!user) return null;

  user.profile.avatar = avatarUrl;
  
  // Log activity
  await user.logActivity({
    type: 'PROFILE_UPDATE',
    ipAddress,
    userAgent,
  });

  return user.save();
}

export async function getProfileActivity(
  userId: string,
  limit: number = 10
): Promise<User['activityLog']> {
  const user = await UserModel.findById(userId);
  if (!user) return [];

  return user.activityLog
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, limit);
} 