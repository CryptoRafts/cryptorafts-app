// Centralized validation utilities
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class ValidationService {
  // Email validation
  static validateEmail(email: string): ValidationResult {
    const errors: string[] = [];
    
    if (!email) {
      errors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push('Please enter a valid email address');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Password validation
  static validatePassword(password: string): ValidationResult {
    const errors: string[] = [];
    
    if (!password) {
      errors.push('Password is required');
    } else {
      if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
      }
      if (!/(?=.*[a-z])/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
      }
      if (!/(?=.*[A-Z])/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
      }
      if (!/(?=.*\d)/.test(password)) {
        errors.push('Password must contain at least one number');
      }
      if (!/(?=.*[@$!%*?&])/.test(password)) {
        errors.push('Password must contain at least one special character');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Phone number validation
  static validatePhoneNumber(phone: string): ValidationResult {
    const errors: string[] = [];
    
    if (!phone) {
      errors.push('Phone number is required');
    } else if (!/^\+?[\d\s\-\(\)]+$/.test(phone)) {
      errors.push('Please enter a valid phone number');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Name validation
  static validateName(name: string, fieldName: string = 'Name'): ValidationResult {
    const errors: string[] = [];
    
    if (!name) {
      errors.push(`${fieldName} is required`);
    } else if (name.length < 2) {
      errors.push(`${fieldName} must be at least 2 characters long`);
    } else if (!/^[a-zA-Z\s\-']+$/.test(name)) {
      errors.push(`${fieldName} can only contain letters, spaces, hyphens, and apostrophes`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // File validation
  static validateFile(
    file: File,
    options: {
      maxSize?: number; // in bytes
      allowedTypes?: string[];
      required?: boolean;
    } = {}
  ): ValidationResult {
    const errors: string[] = [];
    const { maxSize = 10 * 1024 * 1024, allowedTypes, required = false } = options;
    
    if (required && !file) {
      errors.push('File is required');
      return { isValid: false, errors };
    }
    
    if (file) {
      if (file.size > maxSize) {
        errors.push(`File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`);
      }
      
      if (allowedTypes && !allowedTypes.includes(file.type)) {
        errors.push(`File type must be one of: ${allowedTypes.join(', ')}`);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // URL validation
  static validateURL(url: string, required: boolean = false): ValidationResult {
    const errors: string[] = [];
    
    if (required && !url) {
      errors.push('URL is required');
    } else if (url) {
      try {
        new URL(url);
      } catch {
        errors.push('Please enter a valid URL');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Date validation
  static validateDate(date: string, required: boolean = false): ValidationResult {
    const errors: string[] = [];
    
    if (required && !date) {
      errors.push('Date is required');
    } else if (date) {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        errors.push('Please enter a valid date');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Age validation
  static validateAge(dateOfBirth: string, minAge: number = 18): ValidationResult {
    const errors: string[] = [];
    
    if (!dateOfBirth) {
      errors.push('Date of birth is required');
    } else {
      const birthDate = new Date(dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      if (age < minAge) {
        errors.push(`You must be at least ${minAge} years old`);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Form validation
  static validateForm<T extends Record<string, any>>(
    data: T,
    rules: Record<keyof T, (value: any) => ValidationResult>
  ): ValidationResult {
    const errors: string[] = [];
    
    for (const [field, validator] of Object.entries(rules)) {
      const result = validator(data[field]);
      if (!result.isValid) {
        errors.push(...result.errors);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Sanitize input
  static sanitizeInput(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, ''); // Remove event handlers
  }

  // Validate business registration number
  static validateBusinessRegistration(registrationNumber: string): ValidationResult {
    const errors: string[] = [];
    
    if (!registrationNumber) {
      errors.push('Business registration number is required');
    } else if (!/^[A-Z0-9\-]+$/i.test(registrationNumber)) {
      errors.push('Business registration number can only contain letters, numbers, and hyphens');
    } else if (registrationNumber.length < 5) {
      errors.push('Business registration number must be at least 5 characters long');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Validate funding amount
  static validateFundingAmount(amount: string): ValidationResult {
    const errors: string[] = [];
    
    if (!amount) {
      errors.push('Funding amount is required');
    } else {
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount)) {
        errors.push('Please enter a valid funding amount');
      } else if (numAmount <= 0) {
        errors.push('Funding amount must be greater than 0');
      } else if (numAmount > 1000000000) {
        errors.push('Funding amount cannot exceed $1 billion');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
