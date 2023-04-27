import {
  PostInstallationFormikValues,
  GitRepoSourceFormikValues,
  HelmSourceFormikValues,
  isHelmSource,
  WizardFormikValues,
} from '../types/wizardFormTypes';
import { CREATE_NAMESPACE_SYNC_OPTION, INSTANCE_NAMESPACE_VAR } from '../constants';
import { ApplicationSource, ArgoCDSpec } from '../types/resourceTypes';

const HUB_CLUSTER_SERVER = 'https://kubernetes.default.svc';
const NEW_CLUSTER_SERVER = '${new_cluster}';
const DEFAULT_PROJECT = 'default';

const getArgoHelmSource = (values: HelmSourceFormikValues): ApplicationSource => ({
  repoURL: values.url,
  chart: values.chart,
  targetRevision: values.version,
});

const getArgoGitSource = (values: GitRepoSourceFormikValues): ApplicationSource => ({
  repoURL: values.url,
  targetRevision: values.commit,
  path: values.directory,
});

const getArgoSpec = (
  destinationServer: string,
  destinationNamespace: string | undefined,
  source: ApplicationSource,
  syncPolicy: ArgoCDSpec['syncPolicy'],
): ArgoCDSpec => {
  return {
    source,
    destination: {
      namespace: destinationNamespace,
      server: destinationServer,
    },
    project: DEFAULT_PROJECT,
    syncPolicy,
  };
};

const getSyncPolicy = (values: PostInstallationFormikValues): ArgoCDSpec['syncPolicy'] => {
  return {
    automated: values.autoSync ? { prune: values.pruneResources } : undefined,
    syncOptions: values.createNamespace ? [CREATE_NAMESPACE_SYNC_OPTION] : undefined,
  };
};

export const toPostInstallationArgoSpec = (values: PostInstallationFormikValues): ArgoCDSpec => {
  const source: ApplicationSource = isHelmSource(values.source)
    ? getArgoHelmSource(values.source)
    : getArgoGitSource(values.source);
  return getArgoSpec(
    NEW_CLUSTER_SERVER,
    values.destinationNamespace,
    source,
    getSyncPolicy(values),
  );
};

export const toPostInstallationArgoSpecs = (values: WizardFormikValues): ArgoCDSpec[] =>
  values.postInstallation.map((formValues) => toPostInstallationArgoSpec(formValues));

export const toInstallationArgoSpec = (values: WizardFormikValues): ArgoCDSpec =>
  getArgoSpec(
    HUB_CLUSTER_SERVER,
    values.installation.useInstanceNamespace
      ? INSTANCE_NAMESPACE_VAR
      : values.installation.destinationNamespace,
    getArgoHelmSource(values.installation.source),
    { automated: {}, syncOptions: [CREATE_NAMESPACE_SYNC_OPTION] },
  );
