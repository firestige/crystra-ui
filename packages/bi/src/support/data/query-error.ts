/** Preserve machine-readable service codes without binding to a host protocol. */
export class QueryError extends Error {
  constructor(
    readonly code: string,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "QueryError";
  }
}
