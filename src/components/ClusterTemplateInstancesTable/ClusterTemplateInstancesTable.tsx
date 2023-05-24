import { ClusterTemplateInstance } from '../../types/resourceTypes';

import {
  TableComposable,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
  IAction,
  ActionsColumn,
} from '@patternfly/react-table';
import { clusterTemplateInstanceGVK } from '../../constants';
import ClusterTemplateInstanceStatus from './ClusterTemplateInstanceStatus';
import { TFunction } from 'react-i18next';
import React from 'react';
import { ResourceLink, Timestamp } from '@openshift-console/dynamic-plugin-sdk';
import { useTranslation } from '../../hooks/useTranslation';
import DeleteDialog from '../sharedDialogs/DeleteDialog';
import ExternalLink from '../../helpers/ExternalLink';
import { useManagedCluster } from '../../hooks/useManagedCluster';
import CellLoader from '../../helpers/CellLoader';
import { getManagedClusterUrl } from '../../utils/mceUrls';

type TableColumn = {
  title: string;
  id: string;
};

const getTableColumns = (t: TFunction): TableColumn[] => [
  {
    title: t('Instance'),
    id: 'instance',
  },
  {
    title: t('Cluster'),
    id: 'cluster',
  },
  {
    title: t('Status'),
    id: 'status',
  },
  { title: t('Created'), id: 'created' },
];

const ClusterLink = ({ instance }: { instance: ClusterTemplateInstance }) => {
  const [managedCluster, loaded, error] = useManagedCluster(instance);
  return (
    <CellLoader loaded={loaded} error={error}>
      {managedCluster && managedCluster?.metadata?.name ? (
        <ExternalLink
          href={getManagedClusterUrl(managedCluster.metadata.name || '')}
          showIcon={false}
        >
          {managedCluster.metadata.name || ''}
        </ExternalLink>
      ) : (
        <>-</>
      )}
    </CellLoader>
  );
};

const InstanceRow: React.FC<{
  instance: ClusterTemplateInstance;
  columns: TableColumn[];
  index: number;
}> = ({ instance, columns, index }) => {
  const { t } = useTranslation();
  const [deleteDlgOpen, setDeleteDlgOpen] = React.useState(false);
  const getRowActions = (): IAction[] => {
    return [
      {
        title: t('Delete'),
        onClick: () => setDeleteDlgOpen(true),
      },
    ];
  };

  return (
    <Tr data-index={index} data-testid="cluster-template-instance-row">
      <Td dataLabel={columns[0].title}>
        <ResourceLink
          groupVersionKind={clusterTemplateInstanceGVK}
          name={instance.metadata?.name}
          namespace={instance.metadata?.namespace}
          hideIcon
          data-testid={`instance-${instance.metadata?.name || ''}`}
        />
      </Td>
      <Td dataLabel={columns[1].title}>
        <ClusterLink instance={instance} />
      </Td>
      <Td dataLabel={columns[2].title}>
        <ClusterTemplateInstanceStatus instance={instance} />
      </Td>
      <Td dataLabel={columns[3].title}>
        <Timestamp timestamp={instance.metadata?.creationTimestamp || ''} />
      </Td>
      <Td isActionCell>
        <ActionsColumn items={getRowActions()} />
      </Td>
      <DeleteDialog
        isOpen={deleteDlgOpen}
        onDelete={() => setDeleteDlgOpen(false)}
        onCancel={() => setDeleteDlgOpen(false)}
        gvk={clusterTemplateInstanceGVK}
        resource={instance}
      />
    </Tr>
  );
};

const ClusterTemplateInstanceTable: React.FC<{
  instances: ClusterTemplateInstance[];
}> = ({ instances }) => {
  const { t } = useTranslation();
  const columns = getTableColumns(t);
  return (
    <TableComposable variant="compact" data-testid="cluster-template-instances-table">
      <Thead>
        <Tr>
          {columns.map((column) => (
            <Th key={column.id}>{column.title}</Th>
          ))}
        </Tr>
      </Thead>
      <Tbody>
        {instances.map((instance, index) => (
          <InstanceRow instance={instance} columns={columns} index={index} key={index} />
        ))}
      </Tbody>
    </TableComposable>
  );
};

export default ClusterTemplateInstanceTable;
