export class HttpError extends Error {
  constructor(
    private status: number,
    message: string,
    private readonly internalPayload?: any,
    private readonly originalError?: Error
  ) {
    super(message)
  }

  getStatus(): number {
    return this.status
  }

  getInternalPayload(): any {
    return this.internalPayload
  }

  getOriginalError(): Error | undefined {
    return this.originalError
  }
}
