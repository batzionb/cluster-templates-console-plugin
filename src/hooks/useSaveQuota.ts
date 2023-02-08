import {
  k8sCreate,
  k8sDelete,
  K8sModel,
  k8sPatch,
  useK8sModel,
} from '@openshift-console/dynamic-plugin-sdk';
import {
  clusterTemplateQuotaGVK,
  clusterTemplatesRoleRef,
  RBAC_API_GROUP,
  roleBindingGVK,
} from '../constants';
import { Quota, RoleBinding, Subject } from '../types';
import { getApiVersion } from '../utils/k8s';
import { NewQuotaFormikValues } from '../components/ClusterTemplateQuotas/types';
import { useCreateNamespace } from './useCreateNamespace';
import { useClusterTemplateRoleBindings } from './useQuotas';

const getQuota = (values: NewQuotaFormikValues): Quota => {
  return {
    apiVersion: getApiVersion(clusterTemplateQuotaGVK),
    kind: clusterTemplateQuotaGVK.kind,
    metadata: {
      generateName: values.namespace,
      namespace: values.namespace,
    },
    spec: {
      budget: values.hasBudget ? values.budget : undefined,
      allowedTemplates: [],
    },
  };
};

const getSubjects = (names: string[], kind: Subject['kind']): Subject[] =>
  names.map((name) => {
    return {
      kind,
      apiGroup: RBAC_API_GROUP,
      name: name,
    };
  });

const getRoleBinding = (namespace: string, users: string[], groups: string[]): RoleBinding => ({
  metadata: {
    generateName: 'cluster-templates-rb-',
    namespace,
    annotations: {
      ROLE_BINDING_ANNOTATION_KEY: '',
    },
  },
  subjects: [...getSubjects(users, 'User'), ...getSubjects(groups, 'Group')],
  roleRef: clusterTemplatesRoleRef,
});

const deleteExistingRoleBindings = async (
  allClusterTemplateRoleBindings: RoleBinding[],
  roleBindingModel: K8sModel,
  ns: string,
) => {
  const existingRoleBindings = allClusterTemplateRoleBindings.filter(
    (rb) => rb.metadata?.namespace === ns,
  );
  const promises = existingRoleBindings.map((rb) =>
    k8sDelete({ model: roleBindingModel, resource: rb }),
  );
  await Promise.all(promises);
};

const useSaveQuota = (
  quota?: Quota,
): [(values: NewQuotaFormikValues) => Promise<string>, boolean, unknown] => {
  const [roleBindingModel, roleBindingModelLoading] = useK8sModel(roleBindingGVK);
  const [roleBindings, roleBindingsLoaded, roleBindingsError] = useClusterTemplateRoleBindings();
  const [quotaModel, quotaModelLoading] = useK8sModel(clusterTemplateQuotaGVK);
  const [createNamespace, createNamespaceLoading] = useCreateNamespace();

  const createQuota = async (values: NewQuotaFormikValues) => {
    await createNamespace(values.namespace);
    await k8sCreate({ data: getQuota(values), model: quotaModel });
  };

  const updateQuota = async (values: NewQuotaFormikValues) => {
    if (quota && quota.spec?.budget !== values.budget) {
      await k8sPatch({
        model: quotaModel,
        resource: quota,
        data: [{ path: '/spec/budget', op: 'replace', value: values.budget }],
      });
    } else {
      await Promise.resolve();
    }
  };

  const save = async (values: NewQuotaFormikValues): Promise<string> => {
    quota ? await createQuota(values) : await updateQuota(values);
    if (values.users.length || values.groups.length) {
      await deleteExistingRoleBindings(roleBindings, roleBindingModel, values.namespace);
      await k8sCreate({
        data: getRoleBinding(values.namespace, values.users, values.groups),
        model: roleBindingModel,
      });
    }
    return values.namespace;
  };

  return [
    save,
    !roleBindingModelLoading && !quotaModelLoading && !createNamespaceLoading && roleBindingsLoaded,
    roleBindingsError,
  ];
};

export default useSaveQuota;
