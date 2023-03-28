import { useK8sModel, k8sCreate } from '@openshift-console/dynamic-plugin-sdk';
import { clusterTemplateInstanceGVK } from '../constants';
import {
  ClusterTemplate,
  ClusterTemplateInstance,
  ClusterTemplateInstanceParameter,
} from '../types/resourceTypes';
import { getApiVersion } from '../utils/k8s';
import React from 'react';
import { InstanceFormValues, InstanceParameter } from '../types/instanceFormTypes';

const getInstanceParameters = (
  instanceFormValues: InstanceFormValues,
): ClusterTemplateInstanceParameter[] => {
  return instanceFormValues.postInstallation.reduce<ClusterTemplateInstanceParameter[]>(
    (prevVal, postInstallationItem): ClusterTemplateInstanceParameter[] => [
      ...prevVal,
      ...postInstallationItem.parameters.map(
        (param: InstanceParameter): ClusterTemplateInstanceParameter => ({
          ...param,
          clusterSetup: postInstallationItem.name,
        }),
      ),
    ],
    instanceFormValues.installation.parameters as ClusterTemplateInstanceParameter[],
  );
};

const toInstance = (
  instanceFormValues: InstanceFormValues,
  template: ClusterTemplate,
): ClusterTemplateInstance => ({
  apiVersion: getApiVersion(clusterTemplateInstanceGVK),
  kind: clusterTemplateInstanceGVK.kind,
  metadata: {
    name: instanceFormValues.name,
    namespace: instanceFormValues.namespace,
  },
  spec: {
    clusterTemplateRef: template.metadata?.name || '',
    parameters: getInstanceParameters(instanceFormValues),
  },
});

const useCreateInstance = (
  template: ClusterTemplate,
): [(values: InstanceFormValues) => Promise<ClusterTemplateInstance>, boolean] => {
  const [instancesModel, loadingModel] = useK8sModel(clusterTemplateInstanceGVK);
  const create = React.useCallback(
    async (values: InstanceFormValues) => {
      return await k8sCreate({
        model: instancesModel,
        data: toInstance(values, template),
      });
    },
    [instancesModel, template],
  );
  return [create, !loadingModel];
};

export default useCreateInstance;
