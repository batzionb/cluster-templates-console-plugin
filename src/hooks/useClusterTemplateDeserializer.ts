// import { TFunction } from 'i18next';
import React from 'react';
import { applicationSetGVK } from '../constants';
import {
  ApplicationSet,
  ArgoCDSpec,
  ClusterSetup,
  ClusterTemplate,
  RawClusterTemplate,
} from '../types/resourceTypes';
import { useK8sWatchResource } from './k8s';
import useArgocdNamespace from './useArgocdNamespace';

export interface MissingAppSetsError extends Error {
  missinClusterDefinitionAppSet?: string;
  missingClusterSetupAppSets?: string[];
}

const MISSING_APPSETS_ERROR_NAME = 'CLUSTER_DEFINITION_APPLICATION_SET_MISSING';

// const getMissingAppSetsError = (
//   argoNamespace: string,
//   t: TFunction,
//   missingClusterDefinitionAppSet?: string,
//   missingClusterSetupAppSets?: string[],
// ): MissingAppSetsError | undefined =>
//   missingClusterDefinitionAppSet || missingClusterDefinitionAppSet?.length
//     ? {
//         message: t('Failed to find ClusterTemplate ApplicationSets in namespace {{namespace}}', {
//           namepsace: argoNamespace,
//         }),
//         name: MISSING_APPSETS_ERROR_NAME,
//         missinClusterDefinitionAppSet: missingClusterDefinitionAppSet,
//         missingClusterSetupAppSets,
//       }
//     : undefined;

export const isMissingClusterDefinitionAppSetsError = (error: unknown) =>
  (error as Error).name === MISSING_APPSETS_ERROR_NAME;

const useClusterTemplateDeserializer = (): [
  (rawTemplate: RawClusterTemplate) => ClusterTemplate,
  boolean,
  unknown,
] => {
  const [argoNamespace, namespaceLoaded, namespaceError] = useArgocdNamespace();
  const [allAppSets, appSetsLoaded, appSetsError] = useK8sWatchResource<ApplicationSet[]>(
    namespaceLoaded
      ? {
          groupVersionKind: applicationSetGVK,
          namespace: argoNamespace,
          isList: true,
        }
      : null,
  );
  const deserializeTemplate = React.useCallback(
    (rawTemplate: RawClusterTemplate) => {
      const clusterDefinitionAppSet = allAppSets.find(
        (appSet) => appSet.metadata?.name === rawTemplate.spec.clusterDefinition,
      );
      const clusterSetup: ClusterSetup = [];
      const missingClusterSetupAppSets = [];
      for (const appSetName of rawTemplate.spec.clusterSetup || []) {
        const appSet = allAppSets.find((appSet) => appSet.metadata?.name);
        if (!appSet) {
          missingClusterSetupAppSets.push(appSetName);
        } else {
          clusterSetup.push({
            name: appSetName,
            spec: appSet.spec.template.spec,
          });
        }
      }
      const template: ClusterTemplate = {
        metadata: rawTemplate.metadata,
        spec: {
          cost: rawTemplate.spec.cost,
          clusterDefinitionName: clusterDefinitionAppSet?.metadata?.name || '',
          clusterDefinition: clusterDefinitionAppSet?.spec.template.spec || ({} as ArgoCDSpec),
          clusterSetup,
        },
        status: rawTemplate.status,
      };

      return template;
    },
    [allAppSets],
  );
  return [deserializeTemplate, appSetsLoaded && namespaceLoaded, appSetsError || namespaceError];
};

export default useClusterTemplateDeserializer;
