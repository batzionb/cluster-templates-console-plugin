import * as React from 'react';
import { ListPageCreateDropdown, ListPageHeader } from '@openshift-console/dynamic-plugin-sdk';
import { useHistory, useLocation } from 'react-router-dom';
import { Tab, Tabs, TabTitleText } from '@patternfly/react-core';
import ClusterTemplatesTab from './ClusterTemplatesTab';
import RepositoriesTab from './RepositoriesTab';
import { useClusterTemplatesCount } from '../../hooks/useClusterTemplates';
import { clusterTemplateGVK } from '../../constants';
import { useTranslation } from '../../hooks/useTranslation';
import { getNavLabelWithCount } from '../../utils/utils';
import { getReference, getResourceUrl } from '../../utils/k8s';
import { useArgoCDSecretsCount } from '../../hooks/useArgoCDSecrets';
import useDialogsReducer from '../../hooks/useDialogsReducer';
import NewRepositoryDialog from '../HelmRepositories/NewRepositoryDialog';
import { AlertsContextProvider } from '../../alerts/AlertsContext';
import QuotasTab from './QuotasTab';
import { useQuotasCount } from '../../hooks/useQuotas';

type ActionDialogIds = 'newRepositoryDialog';
const actionDialogIds: ActionDialogIds[] = ['newRepositoryDialog'];

const useActiveTab = () => {
  const { search } = useLocation();
  const activeTab = React.useMemo(() => {
    const query = new URLSearchParams(search);
    const tab = query.get('tab');
    return tab ? tab : 'cluster-templates';
  }, [search]);
  return activeTab;
};

const ClusterTemplatesPage = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const templatesCount = useClusterTemplatesCount();
  const argoCDSecretsCount = useArgoCDSecretsCount();
  const activeTab = useActiveTab();
  const quotasCount = useQuotasCount();
  const { openDialog, closeDialog, isDialogOpen } = useDialogsReducer(actionDialogIds);

  const actionItems = React.useMemo(
    () => ({
      NEW_CLUSTER_TEMPLATE: t('Cluster template'),
      NEW_REPOSITORY: t('Repository'),
    }),
    [t],
  );

  const handleTabSelect: React.ComponentProps<typeof Tabs>['onSelect'] = (_, eventKey) => {
    switch (eventKey) {
      case 'repositories':
        history.push(`${getResourceUrl(clusterTemplateGVK)}?tab=repositories`);
        break;
      case 'quotas':
        history.push(`${getResourceUrl(clusterTemplateGVK)}?tab=quotas`);
        break;
      default:
        history.push(getResourceUrl(clusterTemplateGVK));
    }
  };

  const handleCreateDropdownActionClick = (item: string) => {
    switch (item) {
      case 'NEW_CLUSTER_TEMPLATE':
        history.push(`${getResourceUrl(clusterTemplateGVK)}/~new`);
        break;
      case 'NEW_REPOSITORY':
        openDialog('newRepositoryDialog');
        break;
    }
  };

  return (
    <AlertsContextProvider>
      <ListPageHeader title="Cluster templates">
        <ListPageCreateDropdown
          createAccessReview={{ groupVersionKind: getReference(clusterTemplateGVK) }}
          items={actionItems}
          onClick={handleCreateDropdownActionClick}
        >
          {t('Create')}
        </ListPageCreateDropdown>
      </ListPageHeader>
      <div className="co-m-page__body">
        <Tabs
          activeKey={activeTab}
          onSelect={handleTabSelect}
          aria-label="Cluster templates page tabs"
          role="resource-list-tabs"
          usePageInsets
        >
          <Tab
            eventKey="templates"
            title={<TabTitleText>{getNavLabelWithCount('Templates', templatesCount)}</TabTitleText>}
            aria-label="Cluster templates tab"
          />
          <Tab
            eventKey="repositories"
            title={
              <TabTitleText>
                {getNavLabelWithCount('Helm repositories', argoCDSecretsCount)}
              </TabTitleText>
            }
            aria-label="Repositories tab"
          />
          <Tab
            eventKey="quotas"
            title={
              <TabTitleText>{getNavLabelWithCount('Access management', quotasCount)}</TabTitleText>
            }
            aria-label="Access management"
          />
        </Tabs>
        {activeTab === 'cluster-templates' && <ClusterTemplatesTab />}
        {activeTab === 'repositories' && (
          <RepositoriesTab openNewRepositoryDialog={() => openDialog('newRepositoryDialog')} />
        )}
        {activeTab === 'quotas' && <QuotasTab />}
        {isDialogOpen('newRepositoryDialog') && (
          <NewRepositoryDialog closeDialog={() => closeDialog('newRepositoryDialog')} />
        )}
      </div>
    </AlertsContextProvider>
  );
};

export default ClusterTemplatesPage;
