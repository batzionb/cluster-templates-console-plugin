import { useTranslation } from '../../../hooks/useTranslation';
import {
  integerSchema,
  nameSchema,
  NameValidationType,
  positiveIntegerSchema,
} from '../../../utils/commonValidationSchemas';
import { object as objectSchema } from 'yup';
import React from 'react';

const useNewQuotaValidationSchema = () => {
  const { t } = useTranslation();

  const validationSchema = React.useMemo(() => {
    const getNewQuotaValidationSchema = () =>
      objectSchema().shape({
        namespace: nameSchema(t, [], NameValidationType.RFC_1123_LABEL).required(t('Required')),
        budget: integerSchema(t).when('hasBudget', {
          is: true,
          then: (schema) => schema.concat(positiveIntegerSchema(t)),
          otherwise: (schema) => schema.optional(),
        }),
      });

    return getNewQuotaValidationSchema();
  }, [t]);
  return validationSchema;
};

export default useNewQuotaValidationSchema;
