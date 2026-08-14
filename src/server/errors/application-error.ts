export class ApplicationError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message)
  }
}

export class AuthenticationError extends ApplicationError {
  constructor(message = 'Você precisa entrar para continuar.') {
    super(message, 401)
  }
}

export class AuthorizationError extends ApplicationError {
  constructor(message = 'Você não tem autorização para realizar esta ação.') {
    super(message, 403)
  }
}
