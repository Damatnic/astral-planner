/**
 * Comprehensive Input Validator
 * Zero-trust input validation and sanitization
 */

import Logger from '@/lib/logger';

export interface ValidationResult {
  valid: boolean;
  error?: string;
  sanitized?: any;
  issues?: string[];
}

export interface LoginValidationRequest {
  accountId: string;
  pin: string;
  deviceInfo?: {
    userAgent?: string;
    ipAddress?: string;
    fingerprint?: string;
  };
}

export class InputValidator {
  /**
   * Validate account ID
   */
  static validateAccountId(accountId: string): ValidationResult {
    const issues: string[] = [];

    // Check if provided
    if (!accountId) {
      return { valid: false, error: 'Account ID is required' };
    }

    // Check type
    if (typeof accountId !== 'string') {
      return { valid: false, error: 'Account ID must be a string' };
    }

    // Length validation
    if (accountId.length < 3) {
      issues.push('Account ID too short (minimum 3 characters)');
    }

    if (accountId.length > 50) {
      issues.push('Account ID too long (maximum 50 characters)');
    }

    // Character validation (alphanumeric, hyphens, underscores only)
    const validPattern = /^[a-zA-Z0-9_-]+$/;
    if (!validPattern.test(accountId)) {
      issues.push('Account ID contains invalid characters (alphanumeric, hyphens, underscores only)');
    }

    // Prevent common injection attempts
    const suspiciousPatterns = [
      /script/i,
      /javascript/i,
      /onload/i,
      /onerror/i,
      /<.*>/,
      /[{}]/,
      /\$\{.*\}/,
      /eval\(/i,
      /exec\(/i
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(accountId)) {
        Logger.warn('Suspicious account ID detected', { accountId, pattern: pattern.source });
        issues.push('Account ID contains potentially harmful content');
        break;
      }
    }

    if (issues.length > 0) {
      return { valid: false, error: issues[0], issues };
    }

    // Sanitize by trimming and converting to lowercase
    const sanitized = accountId.trim().toLowerCase();

    return { valid: true, sanitized };
  }

  /**
   * Validate PIN
   */
  static validatePin(pin: string): ValidationResult {
    const issues: string[] = [];

    // Check if provided
    if (!pin) {
      return { valid: false, error: 'PIN is required' };
    }

    // Check type
    if (typeof pin !== 'string') {
      return { valid: false, error: 'PIN must be a string' };
    }

    // Length validation (exactly 4 digits)
    if (pin.length !== 4) {
      issues.push('PIN must be exactly 4 digits');
    }

    // Must be numeric
    if (!/^\d{4}$/.test(pin)) {
      issues.push('PIN must contain only digits');
    }

    // Check for weak PINs
    const weakPins = [
      '0000', '1111', '2222', '3333', '4444', 
      '5555', '6666', '7777', '8888', '9999',
      '1234', '4321', '0123', '9876'
    ];

    // Only warn for weak PINs in demo mode, don't reject
    if (weakPins.includes(pin) && pin !== '0000') {
      Logger.warn('Weak PIN detected', { pin });
      // Don't add to issues as this is just a warning
    }

    // Check for sequential patterns
    const hasSequentialPattern = (str: string): boolean => {
      for (let i = 0; i < str.length - 2; i++) {
        const current = parseInt(str[i]);
        const next1 = parseInt(str[i + 1]);
        const next2 = parseInt(str[i + 2]);
        
        if (next1 === current + 1 && next2 === current + 2) {
          return true; // Ascending sequence
        }
        if (next1 === current - 1 && next2 === current - 2) {
          return true; // Descending sequence
        }
      }
      return false;
    };

    if (hasSequentialPattern(pin) && pin !== '7347') {
      Logger.warn('Sequential PIN pattern detected', { pin });
      // Don't add to issues for demo purposes
    }

    if (issues.length > 0) {
      return { valid: false, error: issues[0], issues };
    }

    return { valid: true, sanitized: pin };
  }

  /**
   * Validate device info
   */
  static validateDeviceInfo(deviceInfo: any): ValidationResult {
    if (!deviceInfo) {
      return { valid: true, sanitized: undefined };
    }

    if (typeof deviceInfo !== 'object' || Array.isArray(deviceInfo)) {
      return { valid: false, error: 'Device info must be an object' };
    }

    const sanitized: any = {};
    const issues: string[] = [];

    // Validate userAgent
    if (deviceInfo.userAgent !== undefined) {
      if (typeof deviceInfo.userAgent === 'string') {
        // Limit length and sanitize
        const userAgent = deviceInfo.userAgent.slice(0, 500).replace(/[<>]/g, '');
        sanitized.userAgent = userAgent;
      } else {
        issues.push('User agent must be a string');
      }
    }

    // Validate ipAddress
    if (deviceInfo.ipAddress !== undefined) {
      if (typeof deviceInfo.ipAddress === 'string') {
        // Basic IP validation (IPv4 and IPv6)
        const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
        const ipv6Pattern = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
        const ip = deviceInfo.ipAddress.trim();
        
        if (ipv4Pattern.test(ip) || ipv6Pattern.test(ip) || ip === 'unknown') {
          sanitized.ipAddress = ip;
        } else {
          issues.push('Invalid IP address format');
        }
      } else {
        issues.push('IP address must be a string');
      }
    }

    // Validate fingerprint
    if (deviceInfo.fingerprint !== undefined) {
      if (typeof deviceInfo.fingerprint === 'string') {
        // Fingerprint should be alphanumeric
        const fingerprint = deviceInfo.fingerprint.slice(0, 100).replace(/[^a-zA-Z0-9]/g, '');
        if (fingerprint.length > 0) {
          sanitized.fingerprint = fingerprint;
        }
      } else {
        issues.push('Device fingerprint must be a string');
      }
    }

    if (issues.length > 0) {
      return { valid: false, error: issues[0], issues };
    }

    return { valid: true, sanitized };
  }

  /**
   * Validate email address
   */
  static validateEmail(email: string): ValidationResult {
    if (!email) {
      return { valid: false, error: 'Email is required' };
    }

    if (typeof email !== 'string') {
      return { valid: false, error: 'Email must be a string' };
    }

    // Basic email validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return { valid: false, error: 'Invalid email format' };
    }

    // Length validation
    if (email.length > 254) {
      return { valid: false, error: 'Email address too long' };
    }

    // Check for suspicious patterns
    const suspiciousPatterns = [
      /script/i,
      /javascript/i,
      /<.*>/,
      /[{}]/
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(email)) {
        Logger.warn('Suspicious email detected', { email, pattern: pattern.source });
        return { valid: false, error: 'Email contains invalid characters' };
      }
    }

    const sanitized = email.trim().toLowerCase();
    return { valid: true, sanitized };
  }

  /**
   * Validate login request
   */
  static validateLoginRequest(request: LoginValidationRequest): ValidationResult {
    const issues: string[] = [];

    // Validate accountId
    const accountIdValidation = this.validateAccountId(request.accountId);
    if (!accountIdValidation.valid) {
      return accountIdValidation;
    }

    // Validate PIN
    const pinValidation = this.validatePin(request.pin);
    if (!pinValidation.valid) {
      return pinValidation;
    }

    // Validate device info
    const deviceInfoValidation = this.validateDeviceInfo(request.deviceInfo);
    if (!deviceInfoValidation.valid) {
      return deviceInfoValidation;
    }

    const sanitized = {
      accountId: accountIdValidation.sanitized,
      pin: pinValidation.sanitized,
      deviceInfo: deviceInfoValidation.sanitized
    };

    return { valid: true, sanitized };
  }

  /**
   * Validate user preferences
   */
  static validateUserPreferences(preferences: any): ValidationResult {
    if (!preferences || typeof preferences !== 'object') {
      return { valid: false, error: 'Preferences must be an object' };
    }

    const sanitized: any = {};
    const issues: string[] = [];

    // Validate theme
    if (preferences.theme !== undefined) {
      const validThemes = ['light', 'dark', 'system', 'blue', 'green', 'purple'];
      if (typeof preferences.theme === 'string' && validThemes.includes(preferences.theme)) {
        sanitized.theme = preferences.theme;
      } else {
        issues.push('Invalid theme value');
      }
    }

    // Validate notifications
    if (preferences.notifications !== undefined) {
      if (typeof preferences.notifications === 'boolean') {
        sanitized.notifications = preferences.notifications;
      } else {
        issues.push('Notifications setting must be boolean');
      }
    }

    // Validate autoSave
    if (preferences.autoSave !== undefined) {
      if (typeof preferences.autoSave === 'boolean') {
        sanitized.autoSave = preferences.autoSave;
      } else {
        issues.push('Auto-save setting must be boolean');
      }
    }

    if (issues.length > 0) {
      return { valid: false, error: issues[0], issues };
    }

    return { valid: true, sanitized };
  }

  /**
   * Sanitize HTML content
   */
  static sanitizeHtml(html: string): string {
    if (!html || typeof html !== 'string') {
      return '';
    }

    // Remove script tags and their content
    html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    // Remove dangerous attributes
    html = html.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
    html = html.replace(/\s*javascript\s*:/gi, '');
    
    // Remove dangerous tags
    const dangerousTags = ['script', 'object', 'embed', 'form', 'input', 'iframe'];
    for (const tag of dangerousTags) {
      const regex = new RegExp(`<\\/?${tag}\\b[^>]*>`, 'gi');
      html = html.replace(regex, '');
    }

    return html.trim();
  }

  /**
   * Validate and sanitize text input
   */
  static validateText(text: string, maxLength: number = 1000): ValidationResult {
    if (!text) {
      return { valid: false, error: 'Text is required' };
    }

    if (typeof text !== 'string') {
      return { valid: false, error: 'Text must be a string' };
    }

    if (text.length > maxLength) {
      return { valid: false, error: `Text too long (maximum ${maxLength} characters)` };
    }

    // Check for suspicious patterns
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /vbscript:/i,
      /onload=/i,
      /onerror=/i
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(text)) {
        Logger.warn('Suspicious text content detected', { pattern: pattern.source });
        return { valid: false, error: 'Text contains potentially harmful content' };
      }
    }

    // Sanitize by removing potentially harmful characters
    const sanitized = text
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/[{}]/g, '') // Remove curly braces
      .trim();

    return { valid: true, sanitized };
  }

  /**
   * Validate file upload
   */
  static validateFileUpload(file: any, allowedTypes: string[], maxSize: number): ValidationResult {
    if (!file) {
      return { valid: false, error: 'File is required' };
    }

    // Check file size
    if (file.size > maxSize) {
      return { valid: false, error: `File too large (maximum ${maxSize} bytes)` };
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: `File type not allowed (allowed: ${allowedTypes.join(', ')})` };
    }

    // Check file name
    if (file.name && typeof file.name === 'string') {
      const suspiciousPatterns = [
        /\.exe$/i,
        /\.bat$/i,
        /\.cmd$/i,
        /\.scr$/i,
        /\.vbs$/i,
        /\.js$/i
      ];

      for (const pattern of suspiciousPatterns) {
        if (pattern.test(file.name)) {
          Logger.warn('Suspicious file upload detected', { fileName: file.name });
          return { valid: false, error: 'File type not allowed for security reasons' };
        }
      }
    }

    return { valid: true };
  }
}