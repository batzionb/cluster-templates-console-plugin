import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { Formik } from 'formik';
import { nameSchema } from '../../utils/commonValidationSchemas';
import { SchemaOf, object as objectSchema, string as stringSchema } from 'yup';
import { TFunction } from 'react-i18next';
import { Form } from '@patternfly/react-core';
import CertificateAuthorityField from './CertificateAuthorityField';
import { AlertsContextProvider } from '../../alerts/AlertsContext';
import Alerts from '../../alerts/Alerts';

const caMap = {
  'blablabla.com': 'AAAAAAAAAAAABBBBBBBBBBBBBBBBCCCCCCCCCCCCC',
  'bliblibli.com': 'CCCCCCCCCCCCCBBBBBBBBBBBBBBBBBAAAAAAAAAAAAA',
};

const CertificateAuthorityFieldWrapper = ({
  url,
  ca,
  loaded,
  error,
}: {
  url: string;
  ca: string;
  loaded: boolean;
  error: unknown;
}) => {
  const tFunction: TFunction = (text: string) => text;
  const validationSchema = React.useMemo<SchemaOf<{ name: string }>>(() => {
    return objectSchema().shape({
      name: stringSchema().concat(nameSchema(tFunction)).required('Required'),
    });
  }, []);
  return (
    <AlertsContextProvider>
      <Formik
        initialValues={{ url: url, certificateAuthority: ca, allowSelfSignedCa: false }}
        onSubmit={(values) => console.log(values)}
        validateOnMount
        validationSchema={validationSchema}
        enableReinitialize
      >
        <Form>
          <CertificateAuthorityField useCertificatesAutorityMapResult={[caMap, loaded, error]} />
          <Alerts />
        </Form>
      </Formik>
    </AlertsContextProvider>
  );
};

const meta: Meta<typeof CertificateAuthorityFieldWrapper> = {
  title: 'CertificateAuthorityField',
  component: CertificateAuthorityFieldWrapper,
};

export default meta;
type Story = StoryObj<typeof CertificateAuthorityFieldWrapper>;

export const CertificateAuthorityFieldStory: Story = {
  args: { url: 'http://blablabla.com/repo1', ca: 'blblabla', loaded: true, error: null },
};

export const EmptyURL: Story = {
  args: { url: '', ca: '', loaded: true, error: null },
};
