import { signal } from '@angular/core';
import { vi } from 'vitest';

export function createAuthServiceMock() {
  return {
    userSignal: signal<any>({ uid: 'user123', email: 'me@example.com', displayName: 'Test User' }),
    profileSignal: signal<any>({ nombreNegocio: 'Mi Negocio Test' }),
    authStateInitialized: signal(false),
    waitForAuth: vi.fn().mockResolvedValue(null),
    emailCheckReady: signal(true),
    loginWithGoogle: vi.fn().mockResolvedValue(undefined),
    loginWithEmailAndPassword: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn().mockResolvedValue(undefined)
  };
}

export function createAccountServiceMock() {
  return {
    cuentasAccesibles: signal([
      { propietarioUid: 'user123', esPropia: true },
      { propietarioUid: 'user456', esPropia: false }
    ]),
    cuentaActivaInfo: signal({ propietarioUid: 'user123', esPropia: true }),
    misColaboradores: signal([]),
    cuentasAjenas: signal([]),
    invitacionesPendientesRecibidas: signal([]),
    invitacionesEnviadas: signal([]),
    effectiveAccountUid: vi.fn().mockReturnValue('user123'),
    getNombreNegocioPropietario: vi.fn().mockReturnValue('Negocio Ajeno'),
    getNombrePropietario: vi.fn().mockReturnValue('Otro Propietario'),
    switchAccount: vi.fn(),
    actualizarNombreNegocio: vi.fn(),
    enviarInvitacion: vi.fn(),
    aceptarInvitacion: vi.fn(),
    rechazarInvitacion: vi.fn(),
    eliminarColaborador: vi.fn()
  };
}

export function createOperationServiceMock() {
  return {
    userInstalments: signal([]),
    payInstallment: vi.fn().mockResolvedValue(undefined),
    userOperations: signal([]),
    userSales: signal([]),
    userLoans: signal([]),
    addOperation: vi.fn().mockResolvedValue({ id: 'new-id' }),
    updateOperation: vi.fn().mockResolvedValue(undefined),
    deleteOperation: vi.fn().mockResolvedValue(undefined),
    totalPaid: signal(100),
    moneyOnTheStreet: signal(200),
    collectedToday: signal(50),
    pendingCollectionsToday: signal(30),
    calculateTotal: vi.fn().mockImplementation((montoBase: number, recargo: number) => montoBase + (montoBase * recargo / 100))
  };
}

export function createUiServiceMock() {
  return {
    showErrorAlert: vi.fn().mockResolvedValue(undefined),
    showConfirmAlert: vi.fn().mockImplementation((opts: any) => opts.onConfirm()),
    showToast: vi.fn().mockResolvedValue(undefined)
  };
}

export function createClientServiceMock() {
  return {
    userClients: signal([]),
    addClient: vi.fn().mockResolvedValue(undefined),
    updateClient: vi.fn().mockResolvedValue(undefined),
    deleteClient: vi.fn().mockResolvedValue(undefined)
  };
}

export function createArticleServiceMock() {
  return {
    userArticles: signal([]),
    addArticle: vi.fn().mockResolvedValue(undefined),
    updateArticle: vi.fn().mockResolvedValue(undefined),
    deleteArticle: vi.fn().mockResolvedValue(undefined)
  };
}

export function createLoanPlanServiceMock() {
  return {
    userLoanPlans: signal([]),
    addLoanPlan: vi.fn().mockResolvedValue(undefined),
    updateLoanPlan: vi.fn().mockResolvedValue(undefined),
    deleteLoanPlan: vi.fn().mockResolvedValue(undefined)
  };
}

export function createRouterMock() {
  return {
    navigate: vi.fn().mockResolvedValue(true),
    navigateByUrl: vi.fn().mockResolvedValue(true)
  };
}

export function createNavControllerMock() {
  return {
    navigateRoot: vi.fn(),
    navigateForward: vi.fn(),
    navigateBack: vi.fn()
  };
}
