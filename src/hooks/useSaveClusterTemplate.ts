import {
  k8sCreate,
  k8sUpdate,
  ObjectMetadata,
  useK8sModel,
} from '@openshift-console/dynamic-plugin-sdk';
import { WizardFormikValues } from '../types/wizardFormTypes';
import { clusterTemplateGVK } from '../constants';

import { toInstallationArgoSpec, toPostInstallationArgoSpecs } from '../utils/toArgoSpec';
import { ClusterTemplate, RawClusterTemplate } from '../types/resourceTypes';
import useApplicationSetApi from './useApplicationSetApi';
import isEqual from 'lodash/isEqual';
import React from 'react';
import { TEMPLATE_LABELS } from '../utils/clusterTemplateDataUtils';
import { getApiVersion } from '../utils/k8s';

export const getAnnotations = (
  values: WizardFormikValues,
): ObjectMetadata['annotations'] | undefined => {
  if (values.details.description) {
    return { [TEMPLATE_LABELS.description]: values.details.description };
  }
  return undefined;
};

const toClusterTemplate = (
  values: WizardFormikValues,
  clusterDefinitionAppSetName: string,
  clusterSetupAppSetNames: string[],
  originalClusterTemplate?: ClusterTemplate,
): RawClusterTemplate => {
  return {
    ...originalClusterTemplate,
    apiVersion: getApiVersion(clusterTemplateGVK),
    kind: clusterTemplateGVK.kind,
    metadata: {
      ...originalClusterTemplate?.metadata,
      name: values.details.name,
      annotations: getAnnotations(values),
      labels: values.details.labels,
    },
    spec: {
      cost: originalClusterTemplate?.spec?.cost ? originalClusterTemplate.spec.cost : 0,
      clusterDefinition: clusterDefinitionAppSetName,
      clusterSetup: clusterSetupAppSetNames,
    },
  };
};

export const useSaveClusterTemplate = (
  clusterTemplate?: ClusterTemplate,
): [(values: WizardFormikValues) => Promise<RawClusterTemplate>, boolean, unknown] => {
  const [clusterTemplateModel, clusterTemplateModelLoading] = useK8sModel(clusterTemplateGVK);
  const [
    { createApplicationSet, getOrCreateApplicationSet },
    applicationSetApiLoaded,
    applicationSetApiError,
  ] = useApplicationSetApi();

  const saveClusterTemplate = React.useCallback(
    async (values: WizardFormikValues) => {
      const clusterDefinition = toInstallationArgoSpec(values);
      let clusterDefinitionName = clusterTemplate?.spec.clusterDefinitionName;
      if (
        !clusterTemplate ||
        !isEqual(clusterDefinition, clusterTemplate?.spec.clusterDefinition)
      ) {
        const clusterDefinitionAppSet = await createApplicationSet(toInstallationArgoSpec(values));
        clusterDefinitionName = clusterDefinitionAppSet.metadata?.name;
      }

      const clusterSetupAppSets = await Promise.all(
        toPostInstallationArgoSpecs(values).map((spec) => getOrCreateApplicationSet(spec)),
      );
      const template = toClusterTemplate(
        values,
        clusterDefinitionName || '',
        clusterSetupAppSets.map((appSet) => appSet.metadata?.name || ''),
        clusterTemplate,
      );
      return clusterTemplate
        ? await k8sUpdate({ model: clusterTemplateModel, data: template })
        : await k8sCreate({ model: clusterTemplateModel, data: template });
    },
    [clusterTemplate, clusterTemplateModel, createApplicationSet, getOrCreateApplicationSet],
  );
  return [
    saveClusterTemplate,
    !clusterTemplateModelLoading && applicationSetApiLoaded,
    applicationSetApiError,
  ];
};
