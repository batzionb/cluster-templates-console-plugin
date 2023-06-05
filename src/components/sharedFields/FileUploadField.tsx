import { FileUpload, FormGroup } from '@patternfly/react-core';
import { useField } from 'formik';
import React from 'react';

const MyFileUploadField = ({
  name,
  label,
  isLoading,
}: {
  name: string;
  label: string;
  isLoading: boolean;
}) => {
  const [{ value }, , { setValue }] = useField<string>(name);
  return (
    <FormGroup label={label} fieldId={name}>
      <FileUpload
        id="test"
        type="text"
        value={value}
        filenamePlaceholder="Drag and drop a file or upload one"
        onFileInputChange={() => console.log}
        onDataChange={(value) => setValue(value)}
        onTextChange={(value) => setValue(value)}
        onClearClick={() => setValue('')}
        isLoading={isLoading}
        allowEditingUploadedText={true}
        browseButtonText="Upload"
      />
    </FormGroup>
  );
};

export default MyFileUploadField;
