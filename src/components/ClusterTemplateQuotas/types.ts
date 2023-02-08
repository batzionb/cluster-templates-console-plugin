export type NewQuotaFormikValues = {
  namespace: string;
  users: string[];
  groups: string[];
  hasBudget: boolean;
  budget?: number;
};
