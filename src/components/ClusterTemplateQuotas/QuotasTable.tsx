import { QuotaDetails } from '../../types';

import {
  TableComposable,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
  ActionsColumn,
  CustomActionsToggleProps,
  IAction,
} from '@patternfly/react-table';
import { TFunction } from 'i18next';
import React from 'react';
import { ResourceLink } from '@openshift-console/dynamic-plugin-sdk';
import { namespaceGVK } from '../../constants';
import { ClusterTemplateQuotaCostSummary } from './clusterTemplateQuotaComponents';
import { useTranslation } from '../../hooks/useTranslation';
import {
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  Button,
  Card,
  Stack,
  Divider,
  KebabToggle,
} from '@patternfly/react-core';
import QuotaDialog from './NewQuotaDialog/QuotaDialog';

type TableColumn = {
  title: string;
  id: string;
};

const getTableColumns = (t: TFunction): TableColumn[] => [
  {
    title: t('Namespace'),
    id: 'namespace',
  },
  {
    title: t('Users'),
    id: 'users',
  },
  {
    title: t('Groups'),
    id: 'groups',
  },
  {
    title: t('Cost spent / Total allowed'),
    id: 'cost',
  },
  {
    title: t('Templates'),
    id: 'templates',
  },
  {
    title: t(''),
    id: 'kabab-menu',
  },
];

const QuotaRow: React.FC<{
  quotaDetails: QuotaDetails;
  columns: TableColumn[];
  index: number;
}> = ({ quotaDetails, columns, index }) => {
  const { t } = useTranslation();
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const getRowActions = (): IAction[] => {
    return [
      {
        title: t('Edit'),
        onClick: () => setEditDialogOpen(true),
      },
    ];
  };

  const closeDialog = () => setEditDialogOpen(false);

  return (
    <Tr data-index={index} data-testid="quotas-table-row">
      <Td dataLabel={columns[0].title} data-testid="namespace">
        <ResourceLink
          groupVersionKind={namespaceGVK}
          name={quotaDetails.namespace}
          hideIcon
          data-testid={`namespace-${quotaDetails.namespace}`}
        />
      </Td>
      <Td dataLabel={columns[1].title}>{quotaDetails.users.length || '-'}</Td>
      <Td dataLabel={columns[2].title}>{quotaDetails.groups.length || '-'}</Td>
      <Td dataLabel={columns[3].title} data-testid="cost">
        <ClusterTemplateQuotaCostSummary quotaDetails={quotaDetails} />
      </Td>
      <Td dataLabel={columns[4].title}>{quotaDetails.templates.length || '-'}</Td>
      <Td isActionCell>
        <ActionsColumn
          items={getRowActions()}
          actionsToggle={(props: CustomActionsToggleProps) => <KebabToggle {...props} />}
        />
      </Td>
      {editDialogOpen && (
        <QuotaDialog
          closeDialog={closeDialog}
          onSave={closeDialog}
          isOpen={editDialogOpen}
          quota={quotaDetails.quota}
        />
      )}
    </Tr>
  );
};

const QuotasTableBody: React.FC<{
  quotaDetails: QuotaDetails[];
}> = ({ quotaDetails }) => {
  const { t } = useTranslation();
  const columns = getTableColumns(t);
  return (
    <TableComposable variant="compact" data-testid="quotas-table">
      <Thead>
        <Tr>
          {columns.map((column) => (
            <Th key={column.id}>{column.title}</Th>
          ))}
        </Tr>
      </Thead>
      <Tbody>
        {quotaDetails.map((quotaDetails, index) => (
          <QuotaRow
            quotaDetails={quotaDetails}
            columns={columns}
            index={index}
            key={quotaDetails.uid}
          />
        ))}
      </Tbody>
    </TableComposable>
  );
};

const QuotasTableHeader = ({ onCreate }: { onCreate: () => void }) => {
  const { t } = useTranslation();
  return (
    <Toolbar>
      <ToolbarContent>
        <ToolbarItem>
          <Button onClick={onCreate}>{t('Create a namespace')}</Button>
        </ToolbarItem>
      </ToolbarContent>
    </Toolbar>
  );
};

const QuotasTable = ({
  onCreate,
  quotasDetails,
}: {
  onCreate: () => void;
  quotasDetails: QuotaDetails[];
}) => (
  <Stack>
    <Card>
      <QuotasTableHeader onCreate={onCreate} />
    </Card>
    <Divider />
    <Card>
      <QuotasTableBody quotaDetails={quotasDetails} />
    </Card>
  </Stack>
);

export default QuotasTable;
