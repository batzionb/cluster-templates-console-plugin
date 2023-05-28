import * as React from 'react';
import { ResourceLink, Timestamp } from '@openshift-console/dynamic-plugin-sdk';
import { TextContent, Text, Button } from '@patternfly/react-core';
import { ActionsColumn, Td, Th, Thead, Tr, TableComposable, Tbody } from '@patternfly/react-table';
import { clusterTemplateGVK } from '../../constants';
import { DeserializedClusterTemplate, RowProps, TableColumn } from '../../types/resourceTypes';
import { TFunction } from 'react-i18next';

import {
  ClusterTemplateQuotasSummary,
  ClusterTemplateStatus,
  ClusterTemplateUsage,
  ClusterTemplateVendorLabel,
} from '../sharedDetailItems/clusterTemplateDetailItems';
import { useTranslation } from '../../hooks/useTranslation';
import { useNavigation } from '../../hooks/useNavigation';
import { WithHelpIcon } from '../../helpers/PopoverHelpIcon';
import DeleteDialog from '../sharedDialogs/DeleteDialog';
import useClusterTemplateActions from '../../hooks/useClusterTemplateActions';

const QuotasColumnTitle = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const helpText = (
    <TextContent>
      <Text>{t('You can limit the use of templates with quotas by adding templates to them')}</Text>
      <Button
        variant="link"
        onClick={() => navigation.goToClusterTemplatesPage('quotas')}
        style={{ paddingLeft: 'unset' }}
      >
        {t('Manage quotas')}
      </Button>
    </TextContent>
  );
  return <WithHelpIcon helpText={helpText}>{t('Quotas')}</WithHelpIcon>;
};

function getTableColumns(t: TFunction): TableColumn[] {
  return [
    {
      title: t('Name'),
      id: 'name',
    },
    {
      title: t('Instances'),
      id: 'instances',
    },
    {
      title: <QuotasColumnTitle />,
      id: 'quotas',
    },
    {
      title: t('Vendor'),
      id: 'vendor',
    },
    {
      title: t('Status'),
      id: 'status',
    },
    {
      title: t('Created'),
      id: 'created',
    },
    {
      title: t(''),
      id: 'kabab-menu',
    },
  ];
}

export const ClusterTemplateRow: React.FC<RowProps<DeserializedClusterTemplate>> = ({ obj }) => {
  const { t } = useTranslation();
  const [isDeleteOpen, setDeleteOpen] = React.useState(false);
  const actions = useClusterTemplateActions(obj, () => setDeleteOpen(true));

  const columns = React.useMemo(() => getTableColumns(t), [t]);

  return (
    <Tr>
      <Td dataLabel={columns[0].id}>
        <ResourceLink
          groupVersionKind={clusterTemplateGVK}
          name={obj.metadata?.name}
          namespace={obj.metadata?.namespace}
          hideIcon
        />
      </Td>
      <Td dataLabel={columns[1].id}>
        <ClusterTemplateUsage clusterTemplate={obj} />
      </Td>
      <Td dataLabel={columns[2].id}>
        <ClusterTemplateQuotasSummary clusterTemplate={obj} />
      </Td>
      <Td dataLabel={columns[3].id}>
        <ClusterTemplateVendorLabel clusterTemplate={obj} />
      </Td>
      <Td dataLabel={columns[4].id}>
        <ClusterTemplateStatus clusterTemplate={obj} />
      </Td>
      <Td dataLabel={columns[5].id}>
        <Timestamp timestamp={obj.metadata?.creationTimestamp || ''} />
      </Td>
      <Td isActionCell>
        <ActionsColumn items={actions} />
      </Td>
      {isDeleteOpen && (
        <DeleteDialog
          isOpen={isDeleteOpen}
          onDelete={() => setDeleteOpen(false)}
          onCancel={() => setDeleteOpen(false)}
          gvk={clusterTemplateGVK}
          resource={obj}
        />
      )}
    </Tr>
  );
};

const ClusterTemplatesTable = ({
  clusterTemplates,
}: {
  clusterTemplates: DeserializedClusterTemplate[];
}) => {
  const { t } = useTranslation();
  return (
    <TableComposable
      aria-label="Cluster templates table"
      data-testid="cluster-templates-table"
      variant="compact"
    >
      <Thead>
        <Tr>
          {getTableColumns(t).map((column) => (
            <Th key={column.id}>{column.title}</Th>
          ))}
        </Tr>
      </Thead>
      <Tbody>
        {clusterTemplates.map((template) => (
          <ClusterTemplateRow key={template.metadata?.name} obj={template} />
        ))}
      </Tbody>
    </TableComposable>
  );
};

export default ClusterTemplatesTable;
