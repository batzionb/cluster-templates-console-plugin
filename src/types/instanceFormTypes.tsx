import { ArgoCDSpec } from './resourceTypes';

type PrimitiveValue = 'string' | 'boolean' | 'number';

export const isPrimitiveValue = (value: unknown): value is PrimitiveValue => {
  return ['string', 'boolean', 'number'].includes(typeof value);
};

export type InstanceParameter = {
  name: string;
  value: PrimitiveValue;
  defaultValue: PrimitiveValue;
};

export type InstanceParametersFormValues = {
  name: string;
  argoSpec: ArgoCDSpec;
  parameters: InstanceParameter[];
};

export type InstanceFormValues = {
  name: string;
  namespace: string;
  installation: Omit<InstanceParametersFormValues, 'name'>;
  postInstallation: InstanceParametersFormValues[];
  hasUnsupportedParameters: boolean;
};
