import {
  Alert,
  AlertVariant,
  Button,
  Modal,
  ModalBoxBody,
  ModalBoxFooter,
  ModalVariant,
  Text,
} from '@patternfly/react-core';
import { Formik } from 'formik';
import { TFunction } from 'i18next';
import React from 'react';
import { WithHelpIcon } from '../../../helpers/PopoverHelpIcon';
import { useTranslation } from '../../../hooks/useTranslation';
import { getErrorMessage } from '../../../utils/utils';
import QuotaHelpText from '../QuotaHelpTexts';
import { NewQuotaFormikValues } from '../types';
import Loader from '../../../helpers/Loader';
import { AlertsContextProvider } from '../../../alerts/AlertsContext';
import Alerts from '../../../alerts/Alerts';
import './styles.css';
import useNewQuotaValidationSchema from './newQuotaValidationSchema';
import QuotaForm from './QuotaForm';
import useSaveQuota from '../../../hooks/useSaveQuota';

const getTitleText = (t: TFunction) => t('Publish');

const Header = () => {
  const { t } = useTranslation();
  return (
    <WithHelpIcon helpText={<QuotaHelpText />}>
      <Text component="h2">{getTitleText(t)}</Text>
    </WithHelpIcon>
  );
};

const getInitialValues = (): NewQuotaFormikValues => ({
  namespace: '',
  users: [],
  groups: [],
  hasBudget: false,
});

const QuotaDialog = ({
  quotaName,
  closeDialog,
  onSave,
  isOpen,
}: {
  quota: <Quota></Quota>;
  closeDialog: () => void;
  onSave: (namespace: string) => void;
  isOpen: boolean;
}) => {
  const { t } = useTranslation();
  const [saveQuota, loaded] = useSaveQuota(quotaName);
  const [error, setError] = React.useState<unknown>();
  const validationSchema = useNewQuotaValidationSchema();
  const onSubmit = async (values: NewQuotaFormikValues) => {
    try {
      await saveQuota(values);
      onSave(values.namespace);
    } catch (err) {
      setError(err);
    }
  };

  const onClose = () => {
    closeDialog();
  };
  return (
    <Modal
      variant={ModalVariant.medium}
      onClose={onClose}
      header={<Header />}
      aria-label={getTitleText(t)}
      showClose
      hasNoBodyWrapper
      isOpen={isOpen}
    >
      <AlertsContextProvider>
        <Formik<NewQuotaFormikValues>
          onSubmit={onSubmit}
          initialValues={getInitialValues()}
          validationSchema={validationSchema}
        >
          {({ isSubmitting, handleSubmit }) => (
            <Loader loaded={loaded}>
              <ModalBoxBody>
                <QuotaForm />
                <Alerts />
                {!!error && (
                  <Alert variant={AlertVariant.danger} title={t('Failed to create quota')} isInline>
                    {getErrorMessage(error)}
                  </Alert>
                )}
              </ModalBoxBody>
              <ModalBoxFooter>
                <Button
                  key="confirm"
                  variant="primary"
                  isLoading={isSubmitting}
                  name="confirm"
                  onClick={() => handleSubmit()}
                  type="submit"
                >
                  {t('Save')}
                </Button>

                <Button key="cancel" variant="link" onClick={onClose} data-test="cancel">
                  {t('Cancel')}
                </Button>
              </ModalBoxFooter>
            </Loader>
          )}
        </Formik>
      </AlertsContextProvider>
    </Modal>
  );
};

export default QuotaDialog;
