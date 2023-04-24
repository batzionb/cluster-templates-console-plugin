import { k8sCreate, useK8sModel } from '@openshift-console/dynamic-plugin-sdk';
import isEqual from 'lodash/isEqual';
import React from 'react';
import { applicationSetGVK } from '../constants';
import { ApplicationSet, ArgoCDSpec } from '../types/resourceTypes';
import { getApiVersion } from '../utils/k8s';
import { getBasename } from '../utils/utils';
import { useK8sWatchResource } from './k8s';
import useArgocdNamespace from './useArgocdNamespace';

export const useApplicationSets = (): [ApplicationSet[], boolean, unknown] => {
  const [argoNamespace, namespaceLoaded, namespaceError] = useArgocdNamespace();
  const [appSets, loaded, error] = useK8sWatchResource<ApplicationSet[]>(
    argoNamespace
      ? {
          groupVersionKind: applicationSetGVK,
          isList: true,
          namespace: argoNamespace,
          namespaced: true,
        }
      : null,
  );
  return [appSets, loaded && namespaceLoaded, namespaceError || error];
};

const getAppSetBaseName = (argoSpec: ArgoCDSpec) =>
  argoSpec.source.chart ||
  getBasename(argoSpec.source.path) ||
  getBasename(argoSpec.source.repoURL);

const useApplicationSetApi = (): [
  {
    createApplicationSet: (spec: ArgoCDSpec) => Promise<ApplicationSet>;
    getOrCreateApplicationSet: (spec: ArgoCDSpec) => Promise<ApplicationSet>;
  },
  boolean,
  unknown,
] => {
  const [argoNamespace, namespaceLoaded, namespaceError] = useArgocdNamespace();
  const [appSets, loaded, error] = useApplicationSets();
  const [model, loading] = useK8sModel(applicationSetGVK);

  const createApplicationSet = React.useCallback(
    (spec: ArgoCDSpec): Promise<ApplicationSet> => {
      const name = getAppSetBaseName(spec);
      const appSet: ApplicationSet = {
        apiVersion: getApiVersion(applicationSetGVK),
        kind: applicationSetGVK.kind,
        metadata: {
          generateName: name,
          namespace: argoNamespace,
        },
        spec: {
          generators: [{}],
          template: {
            metadata: {
              name: name,
            },
            spec,
          },
        },
      };
      return k8sCreate({ model, data: appSet });
    },
    [argoNamespace, model],
  );

  const getOrCreateApplicationSet = React.useCallback(
    (spec: ArgoCDSpec): Promise<ApplicationSet> => {
      const existing = appSets.find((appSet) => isEqual(spec, appSet.spec.template.spec));
      if (existing) {
        return Promise.resolve(existing);
      }
      return createApplicationSet(spec);
    },
    [appSets, createApplicationSet],
  );

  return [
    { createApplicationSet, getOrCreateApplicationSet },
    namespaceLoaded && !loading && loaded,
    error || namespaceError,
  ];
};

export default useApplicationSetApi;
