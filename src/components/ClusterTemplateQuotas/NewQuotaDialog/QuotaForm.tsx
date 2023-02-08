import { Form } from '@patternfly/react-core';
import React from 'react';
import { useTranslation } from '../../../hooks/useTranslation';
import AccessFields from './AccessFields';
import BudgetField from './BudgetField';
import QuotaNamespaceField from './QuotaNamespaceField';

const QuotaForm = ({ disableNamespace }: { disableNamespace: boolean }) => {
  const { t } = useTranslation();
  const budgetHelpText = t('Enter the budget for this namespace');
  return (
    <Form className="new-quota-form">
      <QuotaNamespaceField disabled={disableNamespace} />
      <BudgetField
        budgetFieldName="budget"
        hasBudgetFieldName="hasBudget"
        label={t('Total budget of cluster consumption')}
        popoverHelpText={budgetHelpText}
      />
      <AccessFields />
    </Form>
  );
};

export default QuotaForm;
