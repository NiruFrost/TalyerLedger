export const queryKeys = {
  auth: {
    currentUser: ['auth', 'current-user'] as const,
  },
  customers: {
    all: ['customers'] as const,
    detail: (id: string) => ['customers', id] as const,
  },
  vehicles: {
    all: ['vehicles'] as const,
    detail: (id: string) => ['vehicles', id] as const,
    byCustomer: (customerId: string) => ['vehicles', 'customer', customerId] as const,
    timeline: (vehicleId: string) => ['vehicles', vehicleId, 'timeline'] as const,
  },
  workOrders: {
    all: ['work-orders'] as const,
    detail: (id: string) => ['work-orders', id] as const,
    byVehicle: (vehicleId: string) => ['work-orders', 'vehicle', vehicleId] as const,
    paymentsTotal: (id: string | undefined) => ['work-orders', id, 'payments-total'] as const,
  },
  lineItems: {
    all: ['line-items'] as const,
    byWorkOrder: (workOrderId: string) => ['line-items', workOrderId] as const,
  },
  payments: {
    all: ['payments'] as const,
    byWorkOrder: (workOrderId: string) => ['payments', workOrderId] as const,
  },
  attachments: {
    all: ['attachments'] as const,
    byParent: (parentType: string, parentId: string) =>
      ['attachments', parentType, parentId] as const,
    grouped: (parentType: string, parentId: string) =>
      ['attachments', parentType, parentId, 'grouped'] as const,
  },
  laborItems: {
    all: ['labor-items'] as const,
  },
  servicePackages: {
    all: ['service-packages'] as const,
  },
  settings: {
    detail: ['shop-settings'] as const,
  },
  search: {
    results: (term: string) => ['search', term] as const,
  },
  pdf: {
    attachments: (workOrderId: string) => ['pdf-attachments', workOrderId] as const,
  },
} as const
