/* eslint-disable @typescript-eslint/no-explicit-any */
import { TFunction } from 'i18next';
import { number as numberSchema, string as stringSchema, ObjectSchema } from 'yup';
import pickBy from 'lodash/pickBy';
import groupBy from 'lodash/groupBy';
import set from 'lodash/set';
import { ObjectShape } from 'yup/lib/object';
import Lazy from 'yup/lib/Lazy';

const MAX_COST = 1000000;

export const integerSchema = (t: TFunction) => {
  const msg = t('Please enter a valid integer');
  return numberSchema()
    .typeError(msg)
    .integer(msg)
    .max(MAX_COST, t(`Please enter a value smaller than {{max}}`, { max: MAX_COST }));
};

export const positiveIntegerSchema = (t: TFunction) =>
  integerSchema(t).min(0, t('Please enter a positive value'));

type InnerError = { path: string; message: string };
type InnerErrors = { inner: InnerError[] };
type FieldErrors = { [key: string]: string[] };

const fieldErrorReducer = (errors: InnerError[]): FieldErrors => {
  return errors.reduce<FieldErrors>(
    (memo, { path, message }) => ({
      ...memo,
      [path]: (memo[path] || []).concat(message),
    }),
    {},
  );
};

export const getDuplicates = (list: string[]): string[] => {
  const duplicateKeys = pickBy(groupBy(list), (x) => x.length > 1);
  return Object.keys(duplicateKeys);
};

export const getRichTextValidation =
  <T extends ObjectShape>(schema: ObjectSchema<T> | Lazy<any>) =>
  async (values: T): Promise<FieldErrors | undefined> => {
    try {
      await schema.validate(values, {
        abortEarly: false,
      });
    } catch (e) {
      const { inner } = e as InnerErrors;
      if (!inner || inner.length === 0) {
        return {};
      }

      const baseFields: InnerError[] = [];
      const arraySubfields: InnerError[] = [];

      inner.forEach((item) => {
        const isArraySubfield = /\.|\[/.test(item.path);
        if (isArraySubfield) {
          arraySubfields.push(item);
        } else {
          baseFields.push(item);
        }
      });

      const fieldErrors = fieldErrorReducer(baseFields);
      if (arraySubfields.length === 0) {
        return fieldErrors;
      }

      // Now we need to convert the fieldArray errors to the parent object
      // eg. items[0].thumbprint --> { items: [{ thumbprint: ['subField error'] }]}
      const arrayErrors = {};
      arraySubfields.forEach((field) => {
        set(arrayErrors, field.path, [field.message]);
      });
      return { ...fieldErrors, ...arrayErrors };
    }
  };

export enum NameValidationType {
  DNS_SUBDOMAIN = 0,
  RFC_1123_LABEL = 1,
}

const nameValidationData = {
  [NameValidationType.DNS_SUBDOMAIN]: {
    maxLength: 253,
    regex: /^[a-z0-9-.]*$/,
  },
  [NameValidationType.RFC_1123_LABEL]: {
    maxLength: 63,
    regex: /^[a-z0-9-]*$/,
  },
};

export const nameValidationMessages = (
  t: TFunction,
  type: NameValidationType = NameValidationType.DNS_SUBDOMAIN,
) => ({
  INVALID_LENGTH: t('1-{{max}} characters', { max: nameValidationData[type].maxLength }),
  NOT_UNIQUE: t('Must be unique'),
  INVALID_VALUE:
    type === NameValidationType.DNS_SUBDOMAIN
      ? t('Use lowercase alphanumeric characters, dot (.) or hyphen (-)')
      : t('Use lowercase alphanumeric characters, or hyphen (-)'),
  INVALID_START_END: t('Must start and end with an lowercase alphanumeric character'),
});
const CLUSTER_NAME_START_END_REGEX = /^[a-z0-9](.*[a-z0-9])?$/;
export const nameSchema = (
  t: TFunction,
  usedNames: string[] = [],
  type: NameValidationType = NameValidationType.DNS_SUBDOMAIN,
) => {
  const nameValidationMessagesList = nameValidationMessages(t, type);
  return stringSchema()
    .min(1, nameValidationMessagesList.INVALID_LENGTH)
    .max(nameValidationData[type].maxLength, nameValidationMessagesList.INVALID_LENGTH)
    .matches(nameValidationData[type].regex, {
      message: nameValidationMessagesList.INVALID_VALUE,
      excludeEmptyString: true,
    })
    .matches(CLUSTER_NAME_START_END_REGEX, {
      message: nameValidationMessagesList.INVALID_START_END,
      excludeEmptyString: true,
    })
    .test(nameValidationMessagesList.NOT_UNIQUE, nameValidationMessagesList.NOT_UNIQUE, (value) => {
      if (!value) {
        return true;
      }
      return !usedNames.find((n) => n === value);
    });
};
