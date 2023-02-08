import { Page, PageSection, Card, Button } from '@patternfly/react-core';
import React from 'react';
import EmptyPageState from '../../helpers/EmptyPageState';
import TableLoader from '../../helpers/TableLoader';
import { useQuotas } from '../../hooks/useQuotas';
import { useTranslation } from '../../hooks/useTranslation';
import { QuotaDetails } from '../../types';
import QuotasTable from '../ClusterTemplateQuotas/QuotasTable';
import QuotaDialog from '../ClusterTemplateQuotas/NewQuotaDialog/QuotaDialog';

const QuotasTab = () => {
  const { t } = useTranslation();
  const [quotasData, loaded, error] = useQuotas();
  const quotasDetails = React.useMemo<QuotaDetails[]>(
    () => quotasData.getAllQuotasDetails(),
    [quotasData],
  );
  const [newQuotaDialogOpen, setNewQuotaDialogOpen] = React.useState(false);
  const closeDialog = () => setNewQuotaDialogOpen(false);
  return (
    <Page>
      <PageSection>
        <TableLoader
          loaded={loaded}
          error={error}
          errorId="templates-load-error"
          errorMessage={t('The cluster templates could not be loaded.')}
        >
          {quotasDetails.length > 0 ? (
            <QuotasTable
              onCreate={() => {
                setNewQuotaDialogOpen(true);
              }}
              quotasDetails={quotasDetails}
            />
          ) : (
            <Card>
              <EmptyPageState
                title={t("You don't have any access set up")}
                message={t('Click Create a namespace to add the first access')}
                action={
                  <Button onClick={() => setNewQuotaDialogOpen(true)}>
                    {t('Create a namespace')}
                  </Button>
                }
              />
            </Card>
          )}
        </TableLoader>
      </PageSection>
      <QuotaDialog isOpen={newQuotaDialogOpen} closeDialog={closeDialog} onSave={closeDialog} />
    </Page>
  );
};

export default QuotasTab;
