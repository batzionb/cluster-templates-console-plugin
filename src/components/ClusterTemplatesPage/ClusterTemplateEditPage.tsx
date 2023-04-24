import * as React from 'react';
import ErrorBoundary from '../../helpers/ErrorBoundary';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import PageLoader from '../../helpers/PageLoader';
import { ClusterTemplate, RawClusterTemplate } from '../../types/resourceTypes';
import { k8sGet, useK8sModel } from '@openshift-console/dynamic-plugin-sdk';
import { clusterTemplateGVK } from '../../constants';
import ClusterTemplateWizardPage from './ClusterTemplateWizardPage';
import useClusterTemplateDeserializer from '../../hooks/useClusterTemplateDeserializer';

const ClusterTemplateEditPage = ({ match }: { match: { params: { name: string } } }) => {
  const { name } = match.params;
  const [model, modelLoading] = useK8sModel(clusterTemplateGVK);
  const [clusterTemplate, setClusterTemplate] = React.useState<ClusterTemplate>();
  const [clusterTemplateLoading, setLoading] = React.useState(true);
  const [deserialize, deserializeLoaded, deseralizeError] = useClusterTemplateDeserializer();
  const [error, setError] = React.useState<unknown>();

  React.useEffect(() => {
    const fetchClusterTemplate = async () => {
      try {
        setLoading(true);
        const _clusterTemplate = await k8sGet<RawClusterTemplate>({ model, name: name });
        setClusterTemplate(deserialize(_clusterTemplate));
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    if (name && !clusterTemplate && deserializeLoaded && !deseralizeError) {
      void fetchClusterTemplate();
    }
  }, [
    name,
    clusterTemplate,
    model,
    clusterTemplateLoading,
    deserializeLoaded,
    deseralizeError,
    deserialize,
  ]);
  return (
    <ErrorBoundary>
      <PageLoader
        loaded={!modelLoading && !clusterTemplateLoading && !!clusterTemplate}
        error={error}
      >
        <ClusterTemplateWizardPage clusterTemplate={clusterTemplate} />
      </PageLoader>
    </ErrorBoundary>
  );
};

export default ClusterTemplateEditPage;
