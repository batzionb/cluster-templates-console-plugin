import { k8sGet, useK8sModel } from '@openshift-console/dynamic-plugin-sdk';
import React from 'react';
import { clusterTemplateQuotaGVK, CLUSTER_TEMPLATES_ROLE, roleBindingGVK } from '../constants';

import { Quota, QuotaDetails, RoleBinding } from '../types';
import { useK8sWatchResource } from './k8s';

export const useAllQuotas = (): [Quota[], boolean, unknown] =>
  useK8sWatchResource<Quota[]>({
    groupVersionKind: clusterTemplateQuotaGVK,
    isList: true,
    namespaced: true,
  });

export const useClusterTemplateRoleBindings = (): ReturnType<
  typeof useK8sWatchResource<RoleBinding[]>
> => {
  const [rbs, loaded, error] = useK8sWatchResource<RoleBinding[]>({
    groupVersionKind: roleBindingGVK,
    namespaced: true,
    isList: true,
  });
  const clusterTemplateRbs = rbs.filter((rb) => rb.roleRef.name === CLUSTER_TEMPLATES_ROLE);
  return [clusterTemplateRbs, loaded, error];
};

export const getQuotaTemplateNames = (quota: Quota) => {
  return quota.spec?.allowedTemplates?.map((templateData) => templateData.name) || [];
};

export type QuotasData = {
  getAllQuotasDetails: () => QuotaDetails[];
  getQuota: (quotaName: string, quotaNamespace: string) => Promise<Quota>;
  getClusterTemplateQuotasDetails: (clusterTemplateName: string) => QuotaDetails[];
  getQuotaDetails: (quotaName: string, quotaNamespace: string) => QuotaDetails | undefined;
};

const getRbSubjectNames = (rb: RoleBinding, kind: 'User' | 'Group'): string[] =>
  (rb.subjects?.filter((subject) => subject.kind === kind) || []).map((subject) => subject.name);

const getDetails = (quota: Quota, rbs: RoleBinding[]): QuotaDetails => {
  const quotaRbs = rbs.filter((rb) => rb.metadata?.namespace === quota.metadata?.namespace);

  const groupNames = quotaRbs.reduce<string[]>(
    (prevGroupNames, quotaRb) => [...prevGroupNames, ...getRbSubjectNames(quotaRb, 'Group')],
    [],
  );
  const userNames = quotaRbs.reduce<string[]>(
    (prevUserNames, quotaRb) => [...prevUserNames, ...getRbSubjectNames(quotaRb, 'User')],
    [],
  );

  return {
    name: quota.metadata?.name || '',
    namespace: quota.metadata?.namespace || '',
    budget: quota.spec?.budget,
    budgetSpent: quota.status?.budgetSpent,
    uid: quota.metadata?.uid || '',
    groups: groupNames,
    users: userNames,
    templates: quota.spec?.allowedTemplates?.map((template) => template.name) || [],
  };
};

export const useQuotas = (): [QuotasData, boolean, unknown] => {
  const [allQuotas, quotasLoaded, quotasError] = useAllQuotas();
  const [rbs, roleBindingsLoaded, roleBindingsError] = useClusterTemplateRoleBindings();
  const [quotasModel, quotasModelLoading] = useK8sModel(clusterTemplateQuotaGVK);
  const loaded = quotasLoaded && roleBindingsLoaded;
  const error = quotasError || roleBindingsError;
  const data: QuotasData = React.useMemo(() => {
    return {
      getAllQuotasDetails: () => allQuotas.map((quota) => getDetails(quota, rbs)),
      getQuota: async (quotaName: string, quotaNamespace: string) => {
        const quota = allQuotas.find(
          (curQuota) =>
            curQuota.metadata?.name === quotaName &&
            curQuota.metadata?.namespace === quotaNamespace,
        );
        if (quota) {
          return quota;
        }
        return await k8sGet({
          model: quotasModel,
          name: quotaName,
          ns: quotaNamespace,
        });
      },
      getClusterTemplateQuotasDetails: (clusterTemplateName: string) => {
        return allQuotas
          .filter((quota) => getQuotaTemplateNames(quota).includes(clusterTemplateName))
          .map((quota) => getDetails(quota, rbs));
      },
      getQuotaDetails: (name: string, namespace: string) => {
        const quota = allQuotas.find(
          (curQuota) =>
            curQuota.metadata?.name === name && curQuota.metadata?.namespace === namespace,
        );
        return quota ? getDetails(quota, rbs) : undefined;
      },
    };
  }, [allQuotas, rbs, quotasModel]);
  return [data, loaded && !quotasModelLoading, error || quotasError];
};

export const useQuotasCount = () => {
  const [quotas, loaded, loadError] = useAllQuotas();
  return quotas && loaded && !loadError ? quotas.length : undefined;
};
