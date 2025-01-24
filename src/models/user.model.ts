import { Schema, model, Document, Model, Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import type { AdapterUser } from 'next-auth/adapters';

export interface IUser {
  email: string;
  password: string;
  name: string;
  role: 'USER' | 'ADMIN' | 'MODERATOR';
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  image: string | null;
  emailVerified: Date | null;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserMethods {
  comparePassword(password: string): Promise<boolean>;
  generateAuthToken(): string;
  toAuthUser(): Omit<AdapterUser, 'id'> & { id: string };
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
    image: {
      type: String,
      default: null
    },
    emailVerified: {
      type: Date,
      default: null
    },
    lastLogin: Date
  },
  {
    timestamps: true
  }
);

userSchema.methods.comparePassword = async function(password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};

userSchema.methods.toAuthUser = function(): Omit<AdapterUser, 'id'> & { id: string } {
  return {
    id: this._id.toString(),
    email: this.email,
    name: this.name,
    image: this.image,
    emailVerified: this.emailVerified,
    role: this.role,
    status: this.status
  };
};

userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

export const User = (model<IUser, UserModel>('User', userSchema) as UserModel) || 
  model<IUser, UserModel>('User', userSchema); 