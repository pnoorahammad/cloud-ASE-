import mongoose, { Schema, Document } from 'mongoose';
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';

export interface IAuditLog {
  timestamp: Date;
  username: string;
  userId: string;
  action: string;
  details: string;
  status: 'SUCCESS' | 'FAILED';
  logs?: string;
  affectedRules: string[];
}

export interface IAuditLogDocument extends IAuditLog, Document {}

const AuditLogSchema: Schema = new Schema({
  timestamp: { type: Date, default: Date.now, required: true },
  username: { type: String, required: true },
  userId: { type: String, required: true },
  action: { type: String, required: true },
  details: { type: String, required: true },
  status: { type: String, enum: ['SUCCESS', 'FAILED'], required: true },
  logs: { type: String },
  affectedRules: [{ type: String }]
});

let AuditLogModel: mongoose.Model<IAuditLogDocument> | null = null;
try {
  AuditLogModel = mongoose.model<IAuditLogDocument>('AuditLog', AuditLogSchema);
} catch (error) {
  logger.error('Failed to register Mongoose model for AuditLog', error);
}

const LOCAL_LOG_DIR = path.join(__dirname, '../../data');
const LOCAL_LOG_FILE = path.join(LOCAL_LOG_DIR, 'audit_logs.json');

const initLocalStore = () => {
  if (!fs.existsSync(LOCAL_LOG_DIR)) {
    fs.mkdirSync(LOCAL_LOG_DIR, { recursive: true });
  }
  if (!fs.existsSync(LOCAL_LOG_FILE)) {
    fs.writeFileSync(LOCAL_LOG_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
};

export const saveAuditLog = async (logData: IAuditLog): Promise<IAuditLog> => {
  const isMongoConnected = mongoose.connection.readyState === 1;

  if (isMongoConnected && AuditLogModel) {
    try {
      const newLog = new AuditLogModel(logData);
      const saved = await newLog.save();
      logger.info(`Audit Log saved to MongoDB: ${logData.action}`);
      return saved.toObject();
    } catch (err) {
      logger.error('Failed to save audit log to MongoDB, falling back to local file', err);
    }
  }

  try {
    initLocalStore();
    const data = fs.readFileSync(LOCAL_LOG_FILE, 'utf-8');
    const logs = JSON.parse(data);
    const newLog = { ...logData, _id: new Date().getTime().toString() };
    logs.unshift(newLog);
    fs.writeFileSync(LOCAL_LOG_FILE, JSON.stringify(logs, null, 2), 'utf-8');
    logger.info(`Audit Log saved to local file: ${logData.action}`);
    return newLog;
  } catch (err) {
    logger.error('Failed to write audit log to local file', err);
    return logData;
  }
};

export const getAuditLogs = async (limit = 50): Promise<IAuditLog[]> => {
  const isMongoConnected = mongoose.connection.readyState === 1;

  if (isMongoConnected && AuditLogModel) {
    try {
      const docs = await AuditLogModel.find()
        .sort({ timestamp: -1 })
        .limit(limit)
        .exec();
      return docs.map(doc => doc.toObject());
    } catch (err) {
      logger.error('Failed to retrieve audit logs from MongoDB, falling back to local file', err);
    }
  }

  try {
    initLocalStore();
    const data = fs.readFileSync(LOCAL_LOG_FILE, 'utf-8');
    const logs = JSON.parse(data);
    return logs.slice(0, limit);
  } catch (err) {
    logger.error('Failed to read audit logs from local file', err);
    return [];
  }
};
