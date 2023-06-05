import * as React from 'react';
import { useField } from 'formik';
import { FormGroup, FileUpload } from '@patternfly/react-core';
import { FieldProps } from '../../helpers/types';
import { useTranslation } from '../../hooks/useTranslation';

export interface UploadFieldProps extends FieldProps {
  placeholder?: string;
  onChange?: (event: React.FormEvent<HTMLTextAreaElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLDivElement>) => void;
  allowEdittingUploadedText?: boolean;
  isDisabled: boolean;
  isLoading: boolean;
}

const UploadField: React.FC<UploadFieldProps> = ({
  label,
  labelIcon,
  helperText,
  isRequired,
  children,
  isDisabled,
  name,
  onBlur,
  allowEdittingUploadedText = true,
  isLoading,
}) => {
  const { t } = useTranslation();

  const [filename, setFilename] = React.useState<string>();
  const [isFileUploading, setIsFileUploading] = React.useState(false);

  const [field, { touched, error }, helpers] = useField<string | File>(name);
  const fieldId = name;
  const isValid = !((touched || filename) && error);

  return (
    <FormGroup
      fieldId={fieldId}
      label={label}
      helperText={helperText}
      helperTextInvalid={error}
      validated={isValid ? 'default' : 'error'}
      isRequired={isRequired}
      labelIcon={labelIcon}
    >
      {children}
      <FileUpload
        filenamePlaceholder={t('Drag a file here or browse to upload')}
        browseButtonText={t('Browse...')}
        clearButtonText={t('Clear')}
        id={field.name}
        style={{ resize: 'vertical' }}
        validated={isValid ? 'default' : 'error'}
        isRequired={isRequired}
        aria-describedby={`${fieldId}-helper`}
        type="text"
        value={field.value}
        filename={filename}
        onChange={(value, filename) => {
          setFilename(filename);
          helpers.setTouched(true);
          helpers.setValue(value);
        }}
        onBlur={(e) => {
          field.onBlur(e);
          onBlur && onBlur(e);
        }}
        onReadStarted={() => setIsFileUploading(true)}
        onReadFinished={() => setIsFileUploading(false)}
        isLoading={isFileUploading || isLoading}
        isDisabled={isDisabled}
        allowEditingUploadedText={allowEdittingUploadedText}
      />
    </FormGroup>
  );
};

export default UploadField;
