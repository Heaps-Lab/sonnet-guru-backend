export class ApiResponse<T = any> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  error?: string;

  constructor(
    success: boolean,
    statusCode: number,
    message: string,
    data?: T,
    error?: string,
  ) {
    this.success = success;
    this.statusCode = statusCode;
    this.message = message;
    if (data !== undefined) this.data = data;
    if (error) this.error = error;
  }

  static success<T>(
    data: T,
    message = 'Success',
    statusCode = 200,
  ): ApiResponse<T> {
    return new ApiResponse(true, statusCode, message, data);
  }

  static error(
    message: string,
    statusCode = 400,
    error = 'Bad Request',
  ): ApiResponse {
    return new ApiResponse(false, statusCode, message, undefined, error);
  }
}
