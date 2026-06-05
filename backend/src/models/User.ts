import mongoose, { Schema, Document } from 'mongoose';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { promisify } from 'util';
import { logger } from '../utils/logger';

const scrypt = promisify(crypto.scrypt);

export interface IUser {
  email: string;
  passwordHash: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  emailAddress?: string;
  jobRole?: string;
  company?: string;
  country?: string;
  postalCode?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUserDocument extends IUser, Document {}

const UserSchema = new Schema<IUserDocument>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    fullName: { type: String, required: true, trim: true },
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    emailAddress: { type: String, lowercase: true, trim: true },
    jobRole: { type: String, trim: true },
    company: { type: String, trim: true },
    country: { type: String, trim: true },
    postalCode: { type: String, trim: true }
  },
  { timestamps: true }
);

let UserModel: mongoose.Model<IUserDocument> | null = null;
try {
  UserModel = mongoose.model<IUserDocument>('User', UserSchema);
} catch (error) {
  logger.error('Failed to register Mongoose model for User', error);
}

const LOCAL_DIR = path.join(__dirname, '../../data');
const LOCAL_FILE = path.join(LOCAL_DIR, 'users.json');

const initLocalStore = () => {
  if (!fs.existsSync(LOCAL_DIR)) fs.mkdirSync(LOCAL_DIR, { recursive: true });
  if (!fs.existsSync(LOCAL_FILE)) fs.writeFileSync(LOCAL_FILE, JSON.stringify([], null, 2), 'utf-8');
};

const readLocalUsers = (): Array<IUser & { _id: string }> => {
  initLocalStore();
  return JSON.parse(fs.readFileSync(LOCAL_FILE, 'utf-8'));
};

const writeLocalUsers = (users: Array<IUser & { _id: string }>) => {
  initLocalStore();
  fs.writeFileSync(LOCAL_FILE, JSON.stringify(users, null, 2), 'utf-8');
};

export const hashPassword = async (password: string) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt:${salt}:${derived.toString('hex')}`;
};

export const comparePassword = async (password: string, stored: string) => {
  const [algo, salt, hash] = stored.split(':');
  if (algo !== 'scrypt' || !salt || !hash) return false;
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), derived);
};

export const findUserByEmail = async (email: string): Promise<(IUser & { _id: string }) | null> => {
  const normalized = email.toLowerCase().trim();
  if (mongoose.connection.readyState === 1 && UserModel) {
    const doc = await UserModel.findOne({ email: normalized }).exec();
    if (doc) return { ...doc.toObject(), _id: doc._id.toString() };
  }
  const users = readLocalUsers();
  return users.find((u) => u.email === normalized) || null;
};

export const findUserById = async (id: string): Promise<(IUser & { _id: string }) | null> => {
  if (mongoose.connection.readyState === 1 && UserModel) {
    const doc = await UserModel.findById(id).exec();
    if (doc) return { ...doc.toObject(), _id: doc._id.toString() };
  }
  const users = readLocalUsers();
  return users.find((u) => u._id === id) || null;
};

export const createUser = async (data: {
  email: string;
  password: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  emailAddress?: string;
  jobRole?: string;
  company?: string;
  country?: string;
  postalCode?: string;
}) => {
  const existing = await findUserByEmail(data.email);
  if (existing) throw new Error('Email already registered');

  const passwordHash = await hashPassword(data.password);
  const userData = {
    email: data.email.toLowerCase().trim(),
    passwordHash,
    fullName: data.fullName.trim(),
    firstName: data.firstName?.trim(),
    lastName: data.lastName?.trim(),
    emailAddress: data.emailAddress?.toLowerCase().trim(),
    jobRole: data.jobRole?.trim(),
    company: data.company?.trim(),
    country: data.country?.trim(),
    postalCode: data.postalCode?.trim()
  };

  if (mongoose.connection.readyState === 1 && UserModel) {
    const doc = await new UserModel(userData).save();
    return { ...doc.toObject(), _id: doc._id.toString() };
  }

  const users = readLocalUsers();
  const newUser = { ...userData, _id: Date.now().toString(), createdAt: new Date(), updatedAt: new Date() };
  users.push(newUser);
  writeLocalUsers(users);
  return newUser;
};

export const updateUser = async (
  id: string,
  updates: Partial<{
    email: string;
    passwordHash: string;
    fullName: string;
    firstName: string;
    lastName: string;
    emailAddress: string;
    jobRole: string;
    company: string;
    country: string;
    postalCode: string;
  }>
) => {
  if (updates.email) {
    const taken = await findUserByEmail(updates.email);
    if (taken && taken._id !== id) throw new Error('Email already in use');
    updates.email = updates.email.toLowerCase().trim();
  }

  if (mongoose.connection.readyState === 1 && UserModel) {
    const doc = await UserModel.findByIdAndUpdate(id, { $set: updates }, { new: true }).exec();
    if (!doc) throw new Error('User not found');
    return { ...doc.toObject(), _id: doc._id.toString() };
  }

  const users = readLocalUsers();
  const idx = users.findIndex((u) => u._id === id);
  if (idx === -1) throw new Error('User not found');
  users[idx] = { ...users[idx], ...updates, updatedAt: new Date() };
  writeLocalUsers(users);
  return users[idx];
};
