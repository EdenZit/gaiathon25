import mongoose, { Document, Model, Schema } from 'mongoose';

export interface UserActivity {
  type: 'LOGIN' | 'PROFILE_UPDATE' | 'PASSWORD_CHANGE' | 'TWO_FACTOR_UPDATE';
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface User extends Document {
  email: string;
  password: string;
  name: string;
  role: 'USER' | 'ADMIN';
  twoFactorEnabled: boolean;
  profile: {
    avatar?: string;
    bio?: string;
    location?: string;
    website?: string;
    socialLinks?: {
      twitter?: string;
      github?: string;
      linkedin?: string;
    };
  };
  status: {
    isVerified: boolean;
    verificationToken?: string;
    verificationExpires?: Date;
    resetPasswordToken?: string;
    resetPasswordExpires?: Date;
    lastActive?: Date;
    lastLogin?: Date;
  };
  activityLog: UserActivity[];
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<User>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
    },
    role: {
      type: String,
      enum: ['USER', 'ADMIN'],
      default: 'USER',
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    profile: {
      avatar: String,
      bio: {
        type: String,
        maxlength: 500,
      },
      location: String,
      website: String,
      socialLinks: {
        twitter: String,
        github: String,
        linkedin: String,
      },
    },
    status: {
      isVerified: {
        type: Boolean,
        default: false,
      },
      verificationToken: String,
      verificationExpires: Date,
      resetPasswordToken: String,
      resetPasswordExpires: Date,
      lastActive: Date,
      lastLogin: Date,
    },
    activityLog: [{
      type: {
        type: String,
        required: true,
        enum: ['LOGIN', 'PROFILE_UPDATE', 'PASSWORD_CHANGE', 'TWO_FACTOR_UPDATE'],
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
      ipAddress: String,
      userAgent: String,
    }],
  },
  {
    timestamps: true,
  }
);

// Add indexes
userSchema.index({ email: 1 });
userSchema.index({ 'status.verificationToken': 1 });
userSchema.index({ 'status.resetPasswordToken': 1 });

// Add instance methods
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.status.verificationToken;
  delete obj.status.resetPasswordToken;
  return obj;
};

// Add a method to log user activity
userSchema.methods.logActivity = function(
  activity: Omit<UserActivity, 'timestamp'>
) {
  this.activityLog.push({
    ...activity,
    timestamp: new Date(),
  });
  this.status.lastActive = new Date();
  return this.save();
};

// Update last active timestamp
userSchema.methods.updateLastActive = function() {
  this.status.lastActive = new Date();
  return this.save();
};

export const UserModel: Model<User> = mongoose.models.User || mongoose.model<User>('User', userSchema); 