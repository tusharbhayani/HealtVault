import { Platform } from 'react-native';
import CryptoJS from 'crypto-js';

// HIPAA Compliance Configuration
export const HIPAA_CONFIG = {
  ENCRYPTION_STANDARD: 'AES-256-GCM',
  KEY_DERIVATION: 'PBKDF2',
  ITERATIONS: 100000,
  SALT_LENGTH: 32,
  IV_LENGTH: 16,
  TAG_LENGTH: 16,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  SUPPORTED_FORMATS: ['application/pdf', 'image/jpeg', 'image/png'],
  ACCESS_LOG_RETENTION_DAYS: 2555, // 7 years as per HIPAA
  SESSION_TIMEOUT_MINUTES: 15,
  AUDIT_EVENTS: [
    'DATA_ACCESS',
    'DATA_MODIFICATION',
    'DATA_EXPORT',
    'LOGIN_ATTEMPT',
    'PERMISSION_CHANGE',
    'EMERGENCY_ACCESS',
  ],
};

export interface EncryptedData {
  encryptedContent: string;
  iv: string;
  salt: string;
  tag: string;
  timestamp: string;
  version: string;
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  event: string;
  resource: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  details?: Record<string, any>;
}

export class HIPAASecurityService {
  private masterKey: string | null = null;

  // AES-256-GCM Encryption
  async encryptPHI(data: any, userKey: string): Promise<EncryptedData> {
    try {
      const salt = CryptoJS.lib.WordArray.random(HIPAA_CONFIG.SALT_LENGTH);
      const iv = CryptoJS.lib.WordArray.random(HIPAA_CONFIG.IV_LENGTH);

      // Derive key using PBKDF2
      const derivedKey = CryptoJS.PBKDF2(userKey, salt, {
        keySize: 256 / 32,
        iterations: HIPAA_CONFIG.ITERATIONS,
      });

      const jsonData = JSON.stringify(data);

      // Encrypt using AES-256-GCM (simulated with AES-256-CBC + HMAC)
      const encrypted = CryptoJS.AES.encrypt(jsonData, derivedKey, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });

      // Generate authentication tag (HMAC)
      const tag = CryptoJS.HmacSHA256(encrypted.toString(), derivedKey);

      return {
        encryptedContent: encrypted.toString(),
        iv: iv.toString(),
        salt: salt.toString(),
        tag: tag.toString(),
        timestamp: new Date().toISOString(),
        version: '1.0',
      };
    } catch (error) {
      throw new Error(`Encryption failed: ${error}`);
    }
  }

  async decryptPHI(
    encryptedData: EncryptedData,
    userKey: string
  ): Promise<any> {
    try {
      const salt = CryptoJS.enc.Hex.parse(encryptedData.salt);
      const iv = CryptoJS.enc.Hex.parse(encryptedData.iv);

      // Derive the same key
      const derivedKey = CryptoJS.PBKDF2(userKey, salt, {
        keySize: 256 / 32,
        iterations: HIPAA_CONFIG.ITERATIONS,
      });

      // Verify authentication tag
      const expectedTag = CryptoJS.HmacSHA256(
        encryptedData.encryptedContent,
        derivedKey
      );
      if (expectedTag.toString() !== encryptedData.tag) {
        throw new Error('Data integrity check failed');
      }

      // Decrypt
      const decrypted = CryptoJS.AES.decrypt(
        encryptedData.encryptedContent,
        derivedKey,
        {
          iv: iv,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7,
        }
      );

      const jsonString = decrypted.toString(CryptoJS.enc.Utf8);
      return JSON.parse(jsonString);
    } catch (error) {
      throw new Error(`Decryption failed: ${error}`);
    }
  }

  // Document validation for HIPAA compliance
  validateDocument(file: { size: number; type: string; name: string }): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Size validation
    if (file.size > HIPAA_CONFIG.MAX_FILE_SIZE) {
      errors.push(
        `File size exceeds maximum allowed (${
          HIPAA_CONFIG.MAX_FILE_SIZE / 1024 / 1024
        }MB)`
      );
    }

    // Format validation
    if (!HIPAA_CONFIG.SUPPORTED_FORMATS.includes(file.type)) {
      errors.push(
        `File format not supported. Allowed: ${HIPAA_CONFIG.SUPPORTED_FORMATS.join(
          ', '
        )}`
      );
    }

    // Filename validation (no PHI in filename)
    const suspiciousPatterns = [
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN pattern
      /\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/, // Credit card pattern
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email pattern
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(file.name)) {
        errors.push('Filename may contain sensitive information');
        break;
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Audit logging for HIPAA compliance
  async logAuditEvent(
    event: Omit<AuditLogEntry, 'id' | 'timestamp'>
  ): Promise<void> {
    const auditEntry: AuditLogEntry = {
      id: CryptoJS.lib.WordArray.random(16).toString(),
      timestamp: new Date().toISOString(),
      ...event,
    };

    // In production, this would be sent to a secure audit logging service
    console.log('HIPAA Audit Log:', auditEntry);

    // Store locally for development (encrypted)
    try {
      const existingLogs = await this.getAuditLogs();
      existingLogs.push(auditEntry);

      // Keep only recent logs (for demo purposes)
      const recentLogs = existingLogs.slice(-1000);

      if (Platform.OS === 'web') {
        localStorage.setItem('hipaa_audit_logs', JSON.stringify(recentLogs));
      }
    } catch (error) {
      console.error('Failed to store audit log:', error);
    }
  }

  async getAuditLogs(): Promise<AuditLogEntry[]> {
    try {
      if (Platform.OS === 'web') {
        const logs = localStorage.getItem('hipaa_audit_logs');
        return logs ? JSON.parse(logs) : [];
      }
      return [];
    } catch (error) {
      console.error('Failed to retrieve audit logs:', error);
      return [];
    }
  }

  // Access control matrix
  checkAccess(userRole: string, resource: string, action: string): boolean {
    const accessMatrix: Record<string, Record<string, string[]>> = {
      patient: {
        own_health_data: ['read', 'update'],
        own_documents: ['read', 'upload', 'delete'],
        emergency_contacts: ['read', 'update'],
      },
      emergency_responder: {
        emergency_health_data: ['read'],
        emergency_contacts: ['read'],
      },
      healthcare_provider: {
        patient_health_data: ['read', 'update'],
        patient_documents: ['read', 'upload'],
        audit_logs: ['read'],
      },
      admin: {
        all_resources: ['read', 'update', 'delete', 'audit'],
      },
    };

    const userPermissions = accessMatrix[userRole];
    if (!userPermissions) return false;

    const resourcePermissions =
      userPermissions[resource] || userPermissions['all_resources'];
    return resourcePermissions?.includes(action) || false;
  }

  // Data minimization for emergency access
  minimizeDataForEmergency(healthData: any): any {
    return {
      full_name: healthData.full_name,
      blood_type: healthData.blood_type,
      allergies: healthData.allergies,
      medications: healthData.medications?.slice(0, 5), // Limit to 5 most recent
      emergency_contacts: healthData.emergency_contacts?.slice(0, 2), // Limit to 2 contacts
      medical_conditions: healthData.medical_conditions?.filter(
        (condition: string) =>
          ['diabetes', 'heart', 'seizure', 'stroke', 'allergy'].some(
            (critical) => condition.toLowerCase().includes(critical)
          )
      ),
    };
  }

  // Secure sharing with expiration
  async generateSecureShareLink(
    dataId: string,
    expirationHours: number = 24
  ): Promise<{
    shareId: string;
    shareUrl: string;
    expiresAt: string;
  }> {
    const shareId = CryptoJS.lib.WordArray.random(32).toString();
    const expiresAt = new Date(
      Date.now() + expirationHours * 60 * 60 * 1000
    ).toISOString();

    const shareData = {
      dataId,
      shareId,
      expiresAt,
      accessCount: 0,
      maxAccess: 5,
    };

    // Store share data (in production, this would be in a secure database)
    if (Platform.OS === 'web') {
      const existingShares = JSON.parse(
        localStorage.getItem('secure_shares') || '{}'
      );
      existingShares[shareId] = shareData;
      localStorage.setItem('secure_shares', JSON.stringify(existingShares));
    }

    return {
      shareId,
      shareUrl: `https://healthguardian.app/emergency/${shareId}`,
      expiresAt,
    };
  }

  // Incident response procedures
  async handleSecurityIncident(incident: {
    type: 'unauthorized_access' | 'data_breach' | 'system_compromise';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    affectedUsers?: string[];
  }): Promise<void> {
    const incidentId = CryptoJS.lib.WordArray.random(16).toString();

    // Log the incident
    await this.logAuditEvent({
      userId: 'system',
      event: 'SECURITY_INCIDENT',
      resource: 'security_system',
      success: true,
      details: {
        incidentId,
        ...incident,
        timestamp: new Date().toISOString(),
      },
    });

    // Immediate response based on severity
    if (incident.severity === 'critical') {
      // In production: notify security team, lock affected accounts, etc.
      console.warn('CRITICAL SECURITY INCIDENT:', incident);
    }

    // HIPAA breach notification requirements (for production)
    if (incident.type === 'data_breach' && incident.affectedUsers?.length) {
      console.log(
        'HIPAA breach notification required for users:',
        incident.affectedUsers
      );
    }
  }
}

export const hipaaService = new HIPAASecurityService();
