import { Schema, model, Document, Model, Types } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser {
  email: string;
  password: string;
  name: string;
  role: 'USER' | 'ADMIN' | 'MODERATOR';
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  image?: string;
  emailVerified?: Date;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserMethods {
  comparePassword(password: string): Promise<boolean>;
  generateAuthToken(): string;
}

export type UserDocument = Document<Types.ObjectId, {}, IUser> & 
  IUser & 
  IUserMethods & {
    _id: Types.ObjectId;
  };

export type UserModel = Model<IUser, {}, IUserMethods>;

const userSchema = new Schema<IUser, UserModel, IUserMethods>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    password: {
      type: String,
      required: true,
      minlength: 8
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    role: {
      type: String,
      enum: ['USER', 'ADMIN', 'MODERATOR'],
      default: 'USER'
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'PENDING'],
      default: 'PENDING'
    },
    image: String,
    emailVerified: Date,
    lastLogin: Date
  },
  {
    timestamps: true
  }
);

userSchema.methods.comparePassword = async function(password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};

userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

export const User = (model<IUser, UserModel>('User', userSchema) as UserModel) || 
  model<IUser, UserModel>('User', userSchema); 