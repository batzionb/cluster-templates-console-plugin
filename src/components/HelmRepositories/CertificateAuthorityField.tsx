import { useFormikContext } from 'formik';
import { CheckboxField } from 'formik-pf';
import React from 'react';
import { useAddAlertOnError } from '../../alerts/useAddAlertOnError';
import { useTranslation } from '../../hooks/useTranslation';
import UploadField from '../sharedFields/UploadField';
import { RepositoryFormValues } from './types';

const getUrlCertificateAuthority = (url: string, caMap: Record<string, string>): string => {
  try {
    const baseUrl = new URL(url).hostname;
    return caMap[baseUrl] || '';
  } catch (err) {
    return '';
  }
};

const CertificateAuthorityField = ({
  useCertificatesAutorityMapResult,
}: {
  useCertificatesAutorityMapResult: [Record<string, string>, boolean, unknown];
}) => {
  const [caMap, loaded, error] = useCertificatesAutorityMapResult;
  const { values, setFieldValue } = useFormikContext<RepositoryFormValues>();
  const prevUrl = React.useRef<string>();
  const { t } = useTranslation();
  React.useEffect(() => {
    if (values.url !== prevUrl.current && !values.allowSelfSignedCa) {
      const ca = getUrlCertificateAuthority(values.url, caMap);
      if (ca) {
        setFieldValue('certificateAuthority', ca);
      }
      prevUrl.current = values.url;
    }
  }, [caMap, setFieldValue, values.allowSelfSignedCa, values.url]);
  // t('Failed to get the available Certificate Authorities');
  useAddAlertOnError(error, 'Failed to get the available Certificate Authorities');
  return (
    <>
      <CheckboxField
        name="allowSelfSignedCa"
        fieldId="allowSelfSignedCa"
        label={t('Allow self-signed certificates')}
      />
      <UploadField
        isLoading={!loaded}
        name="certificateAuthority"
        isDisabled={values.allowSelfSignedCa}
        label={t('Certificate authority (CA) certificate')}
      />
    </>
  );
};

export default CertificateAuthorityField;
