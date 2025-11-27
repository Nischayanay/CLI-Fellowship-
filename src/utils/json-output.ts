/**
 * JSON Output Module
 * Provides utilities for outputting command results in JSON format
 * for automation and scripting purposes
 */

/**
 * Standard JSON response structure
 */
export interface JSONResponse {
  status: 'success' | 'error';
  timestamp: string;
  data?: any;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    processingTime?: number;
    [key: string]: any;
  };
}

/**
 * JSON output formatter
 */
export const jsonOutput = {
  /**
   * Check if JSON output mode is enabled
   */
  isEnabled(): boolean {
    // Check for --json flag in process.argv
    return process.argv.includes('--json');
  },

  /**
   * Output success response
   */
  success(data: any, metadata?: any): void {
    const response: JSONResponse = {
      status: 'success',
      timestamp: new Date().toISOString(),
      data,
    };

    if (metadata) {
      response.metadata = metadata;
    }

    this.output(response);
  },

  /**
   * Output error response
   */
  error(code: string, message: string, details?: any): void {
    const response: JSONResponse = {
      status: 'error',
      timestamp: new Date().toISOString(),
      error: {
        code,
        message,
        details,
      },
    };

    this.output(response);
  },

  /**
   * Output JSON to stdout
   */
  output(response: JSONResponse): void {
    // Ensure clean JSON output without any decorative elements
    console.log(JSON.stringify(response, null, 2));
  },

  /**
   * Validate that data is JSON-serializable
   */
  isSerializable(data: any): boolean {
    try {
      JSON.stringify(data);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Convert non-serializable values to serializable format
   */
  sanitize(data: any): any {
    if (data === null || data === undefined) {
      return data;
    }

    if (data instanceof Date) {
      return data.toISOString();
    }

    if (data instanceof Error) {
      return {
        name: data.name,
        message: data.message,
        stack: data.stack,
      };
    }

    if (Array.isArray(data)) {
      return data.map(item => this.sanitize(item));
    }

    if (typeof data === 'object') {
      const sanitized: any = {};
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          sanitized[key] = this.sanitize(data[key]);
        }
      }
      return sanitized;
    }

    // Primitive types are already serializable
    return data;
  },

  /**
   * Create a standardized error response
   */
  createError(code: string, message: string, details?: any): JSONResponse {
    return {
      status: 'error',
      timestamp: new Date().toISOString(),
      error: {
        code,
        message,
        details: details ? this.sanitize(details) : undefined,
      },
    };
  },

  /**
   * Create a standardized success response
   */
  createSuccess(data: any, metadata?: any): JSONResponse {
    return {
      status: 'success',
      timestamp: new Date().toISOString(),
      data: this.sanitize(data),
      metadata: metadata ? this.sanitize(metadata) : undefined,
    };
  },

  /**
   * Strip ANSI codes from string (in case any slip through)
   */
  stripAnsi(text: string): string {
    // eslint-disable-next-line no-control-regex
    return text.replace(/\x1b\[[0-9;]*m/g, '');
  },

  /**
   * Ensure output contains no ANSI codes
   */
  cleanOutput(response: JSONResponse): JSONResponse {
    const cleaned = JSON.parse(JSON.stringify(response));
    
    const cleanString = (obj: any): any => {
      if (typeof obj === 'string') {
        return this.stripAnsi(obj);
      }
      if (Array.isArray(obj)) {
        return obj.map(cleanString);
      }
      if (typeof obj === 'object' && obj !== null) {
        const result: any = {};
        for (const key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            result[key] = cleanString(obj[key]);
          }
        }
        return result;
      }
      return obj;
    };

    return cleanString(cleaned);
  },
};

/**
 * Export default jsonOutput object for convenience
 */
export default jsonOutput;
