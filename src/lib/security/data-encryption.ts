/**
 * GUARDIAN DATA ENCRYPTION SERVICE
 * Enterprise-grade data protection with multiple encryption layers
 */

import { createCipheriv, createDecipheriv, randomBytes, scrypt, timingSafeEqual, createHmac } from 'crypto';
import { promisify } from 'util';
import Logger from '@/lib/logger';

const scryptAsync = promisify(scrypt);

export enum DataClassification {
  PUBLIC = 'public',
  INTERNAL = 'internal',
  CONFIDENTIAL = 'confidential',
  RESTRICTED = 'restricted',
  TOP_SECRET = 'top_secret'
}

export interface EncryptionConfig {
  classification: DataClassification;
  algorithm: string;
  keyLength: number;
  ivLength: number;
  tagLength: number;
  iterations: number;
}

export interface EncryptedData {
  data: string;
  iv: string;
  tag: string;
  salt: string;
  algorithm: string;
  classification: DataClassification;
  timestamp: number;
  version: string;
  hmac?: string;
}

export interface DecryptionResult {
  success: boolean;
  data?: string;
  error?: string;
  metadata?: {
    classification: DataClassification;
    timestamp: number;
    version: string;
  };
}

/**
 * Advanced Data Encryption Service
 */
export class DataEncryptionService {
  private static readonly ENCRYPTION_VERSION = '1.0.0';
  
  private static readonly ENCRYPTION_CONFIGS: Record<DataClassification, EncryptionConfig> = {
    [DataClassification.PUBLIC]: {
      classification: DataClassification.PUBLIC,
      algorithm: 'aes-128-gcm',
      keyLength: 16,
      ivLength: 12,
      tagLength: 16,
      iterations: 10000
    },
    [DataClassification.INTERNAL]: {
      classification: DataClassification.INTERNAL,
      algorithm: 'aes-192-gcm',
      keyLength: 24,
      ivLength: 12,
      tagLength: 16,
      iterations: 50000
    },
    [DataClassification.CONFIDENTIAL]: {
      classification: DataClassification.CONFIDENTIAL,
      algorithm: 'aes-256-gcm',
      keyLength: 32,
      ivLength: 12,
      tagLength: 16,
      iterations: 100000
    },
    [DataClassification.RESTRICTED]: {
      classification: DataClassification.RESTRICTED,
      algorithm: 'aes-256-gcm',
      keyLength: 32,
      ivLength: 16,
      tagLength: 16,
      iterations: 200000
    },
    [DataClassification.TOP_SECRET]: {
      classification: DataClassification.TOP_SECRET,
      algorithm: 'aes-256-gcm',
      keyLength: 32,
      ivLength: 16,
      tagLength: 16,
      iterations: 500000
    }
  };

  /**
   * Get master key for encryption
   */
  private static getMasterKey(): Buffer {
    const masterKey = process.env.GUARDIAN_MASTER_KEY;
    if (!masterKey) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('GUARDIAN_MASTER_KEY is required in production');
      }
      // Development fallback
      Logger.warn('Using development master key - NOT SECURE FOR PRODUCTION');
      return Buffer.from('dev-master-key-not-secure-for-production-use-only', 'utf8');
    }
    
    return Buffer.from(masterKey, 'base64');
  }

  /**
   * Derive encryption key from master key and salt
   */
  private static async deriveKey(
    salt: Buffer,
    config: EncryptionConfig
  ): Promise<Buffer> {
    const masterKey = this.getMasterKey();
    return scryptAsync(masterKey, salt, config.keyLength) as Promise<Buffer>;
  }

  /**
   * Encrypt sensitive data with classification-based security
   */
  static async encryptData(
    data: string,
    classification: DataClassification = DataClassification.CONFIDENTIAL
  ): Promise<EncryptedData> {
    try {
      if (!data || typeof data !== 'string') {
        throw new Error('Invalid data provided for encryption');
      }

      const config = this.ENCRYPTION_CONFIGS[classification];
      if (!config) {
        throw new Error(`Invalid classification: ${classification}`);
      }

      // Generate random salt and IV
      const salt = randomBytes(32);
      const iv = randomBytes(config.ivLength);

      // Derive encryption key
      const key = await this.deriveKey(salt, config);

      // Create cipher
      const cipher = createCipheriv(config.algorithm, key, iv);

      // Encrypt data
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // Get authentication tag
      const tag = (cipher as any).getAuthTag();

      const encryptedData: EncryptedData = {
        data: encrypted,
        iv: iv.toString('hex'),
        tag: tag.toString('hex'),
        salt: salt.toString('hex'),
        algorithm: config.algorithm,
        classification,
        timestamp: Date.now(),
        version: this.ENCRYPTION_VERSION
      };

      // Add HMAC for additional integrity protection for high-security data
      if (classification === DataClassification.RESTRICTED || classification === DataClassification.TOP_SECRET) {
        encryptedData.hmac = this.generateHMAC(encryptedData, key);
      }

      Logger.info('Data encrypted successfully', {
        classification,
        algorithm: config.algorithm,
        dataLength: data.length,
        encryptedLength: encrypted.length
      });

      return encryptedData;

    } catch (error) {
      Logger.error('Data encryption failed', {
        classification,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypt data with verification
   */
  static async decryptData(encryptedData: EncryptedData): Promise<DecryptionResult> {
    try {
      // Validate input
      if (!encryptedData || typeof encryptedData !== 'object') {
        return { success: false, error: 'Invalid encrypted data format' };
      }

      const { data, iv, tag, salt, algorithm, classification, version, hmac } = encryptedData;
      
      if (!data || !iv || !tag || !salt || !algorithm || !classification) {
        return { success: false, error: 'Missing required encryption metadata' };
      }

      // Get encryption config
      const config = this.ENCRYPTION_CONFIGS[classification];
      if (!config || config.algorithm !== algorithm) {
        return { success: false, error: 'Invalid or unsupported encryption configuration' };
      }

      // Convert hex strings back to buffers
      const ivBuffer = Buffer.from(iv, 'hex');
      const tagBuffer = Buffer.from(tag, 'hex');
      const saltBuffer = Buffer.from(salt, 'hex');

      // Derive the same key
      const key = await this.deriveKey(saltBuffer, config);

      // Verify HMAC if present
      if (hmac) {
        const expectedHmac = this.generateHMAC(encryptedData, key);
        if (!timingSafeEqual(Buffer.from(hmac, 'hex'), Buffer.from(expectedHmac, 'hex'))) {
          Logger.warn('HMAC verification failed during decryption', { classification });
          return { success: false, error: 'Data integrity verification failed' };
        }
      }

      // Create decipher
      const decipher = createDecipheriv(algorithm, key, ivBuffer);
      (decipher as any).setAuthTag(tagBuffer);

      // Decrypt data
      let decrypted = decipher.update(data, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      Logger.info('Data decrypted successfully', {
        classification,
        algorithm,
        version
      });

      return {
        success: true,
        data: decrypted,
        metadata: {
          classification,
          timestamp: encryptedData.timestamp,
          version: version || 'unknown'
        }
      };

    } catch (error) {
      Logger.error('Data decryption failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        classification: encryptedData?.classification
      });

      return {
        success: false,
        error: 'Decryption failed'
      };
    }
  }

  /**
   * Generate HMAC for data integrity
   */
  private static generateHMAC(encryptedData: EncryptedData, key: Buffer): string {
    const hmac = createHmac('sha256', key);
    hmac.update(encryptedData.data);
    hmac.update(encryptedData.iv);
    hmac.update(encryptedData.tag);
    hmac.update(encryptedData.salt);
    hmac.update(encryptedData.algorithm);
    hmac.update(encryptedData.classification);
    hmac.update(encryptedData.timestamp.toString());
    return hmac.digest('hex');
  }

  /**
   * Encrypt field in database record
   */
  static async encryptField(
    value: string,
    fieldName: string,
    classification: DataClassification = DataClassification.CONFIDENTIAL
  ): Promise<string> {
    try {
      if (!value) return value;
      
      const encrypted = await this.encryptData(value, classification);
      
      Logger.debug('Field encrypted', {
        fieldName,
        classification,
        originalLength: value.length,
        encryptedLength: JSON.stringify(encrypted).length
      });
      
      return JSON.stringify(encrypted);
    } catch (error) {
      Logger.error('Field encryption failed', {
        fieldName,
        classification,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Decrypt field from database record
   */
  static async decryptField(encryptedValue: string, fieldName: string): Promise<string> {
    try {
      if (!encryptedValue) return encryptedValue;
      
      // Try to parse as encrypted data
      let encryptedData: EncryptedData;
      try {
        encryptedData = JSON.parse(encryptedValue);
      } catch {
        // If parsing fails, assume it's not encrypted
        return encryptedValue;
      }
      
      // Verify it has encryption structure
      if (!encryptedData.data || !encryptedData.iv || !encryptedData.classification) {
        return encryptedValue;
      }
      
      const result = await this.decryptData(encryptedData);
      
      if (!result.success) {
        Logger.error('Field decryption failed', {
          fieldName,
          error: result.error
        });
        throw new Error(`Failed to decrypt field: ${fieldName}`);
      }
      
      Logger.debug('Field decrypted', {
        fieldName,
        classification: result.metadata?.classification
      });
      
      return result.data!;
    } catch (error) {
      Logger.error('Field decryption error', {
        fieldName,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Encrypt entire object with field-level classification
   */
  static async encryptObject(
    obj: Record<string, any>,
    fieldClassifications: Record<string, DataClassification> = {}
  ): Promise<Record<string, any>> {
    const encrypted: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === undefined) {
        encrypted[key] = value;
        continue;
      }
      
      const classification = fieldClassifications[key] || DataClassification.CONFIDENTIAL;
      
      if (typeof value === 'string' && value.length > 0) {
        encrypted[key] = await this.encryptField(value, key, classification);
      } else if (typeof value === 'object') {
        // Recursively encrypt nested objects
        encrypted[key] = await this.encryptObject(value, fieldClassifications);
      } else {
        encrypted[key] = value;
      }
    }
    
    return encrypted;
  }

  /**
   * Decrypt entire object
   */
  static async decryptObject(encryptedObj: Record<string, any>): Promise<Record<string, any>> {
    const decrypted: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(encryptedObj)) {
      if (value === null || value === undefined) {
        decrypted[key] = value;
        continue;
      }
      
      if (typeof value === 'string') {
        try {
          decrypted[key] = await this.decryptField(value, key);
        } catch {
          // If decryption fails, use original value (might not be encrypted)
          decrypted[key] = value;
        }
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        // Recursively decrypt nested objects
        decrypted[key] = await this.decryptObject(value);
      } else {
        decrypted[key] = value;
      }
    }
    
    return decrypted;
  }

  /**
   * Hash sensitive data for comparison (one-way)
   */
  static hashForComparison(data: string, salt?: string): string {
    const actualSalt = salt || randomBytes(16).toString('hex');
    const hash = createHmac('sha256', this.getMasterKey())
      .update(data + actualSalt)
      .digest('hex');
    
    return `${hash}:${actualSalt}`;
  }

  /**
   * Verify hashed data
   */
  static verifyHash(data: string, hashedData: string): boolean {
    try {
      const [hash, salt] = hashedData.split(':');
      if (!hash || !salt) return false;
      
      const expectedHash = this.hashForComparison(data, salt);
      return timingSafeEqual(
        Buffer.from(hashedData, 'utf8'),
        Buffer.from(expectedHash, 'utf8')
      );
    } catch {
      return false;
    }
  }

  /**
   * Get encryption status and recommendations
   */
  static getEncryptionStatus(): {
    masterKeyConfigured: boolean;
    supportedAlgorithms: string[];
    recommendedClassification: DataClassification;
    securityLevel: 'low' | 'medium' | 'high' | 'maximum';
  } {
    const masterKeyConfigured = !!process.env.GUARDIAN_MASTER_KEY;
    
    return {
      masterKeyConfigured,
      supportedAlgorithms: Object.values(this.ENCRYPTION_CONFIGS).map(c => c.algorithm),
      recommendedClassification: masterKeyConfigured 
        ? DataClassification.CONFIDENTIAL 
        : DataClassification.INTERNAL,
      securityLevel: masterKeyConfigured ? 'maximum' : 'medium'
    };
  }
}

/**
 * Utility functions for common encryption patterns
 */
export class EncryptionUtils {
  /**
   * Encrypt PII (Personally Identifiable Information)
   */
  static async encryptPII(data: string): Promise<string> {
    return DataEncryptionService.encryptField(data, 'pii', DataClassification.RESTRICTED);
  }

  /**
   * Encrypt financial data
   */
  static async encryptFinancial(data: string): Promise<string> {
    return DataEncryptionService.encryptField(data, 'financial', DataClassification.TOP_SECRET);
  }

  /**
   * Encrypt API keys and secrets
   */
  static async encryptSecret(data: string): Promise<string> {
    return DataEncryptionService.encryptField(data, 'secret', DataClassification.TOP_SECRET);
  }

  /**
   * Encrypt user preferences (lower security)
   */
  static async encryptPreferences(data: string): Promise<string> {
    return DataEncryptionService.encryptField(data, 'preferences', DataClassification.INTERNAL);
  }

  /**
   * Decrypt any encrypted field
   */
  static async decrypt(encryptedData: string): Promise<string> {
    return DataEncryptionService.decryptField(encryptedData, 'generic');
  }
}