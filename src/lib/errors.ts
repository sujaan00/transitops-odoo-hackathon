export class AppError extends Error {
  code: string;
  status: number;

  constructor(message: string, code = "BAD_REQUEST", status = 400) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
  }
}

export function getErrorMessage(error: unknown) {
  if (error instanceof AppError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}
