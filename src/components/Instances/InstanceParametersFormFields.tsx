import { Flex, FlexItem, TextInputTypes } from '@patternfly/react-core';
import { useField } from 'formik';
import { CheckboxField, InputField, NumberSpinnerField } from 'formik-pf';
import React from 'react';
import FormSection from '../../helpers/FormSection';
import { InstanceParameter, InstanceParametersFormValues } from '../../types/instanceFormTypes';
import { ArgoCDSpec } from '../../types/resourceTypes';
import ArgoCDSpecDetails from '../sharedDetailItems/ArgoCDSpecDetails';
import { FieldProps } from '../../helpers/types';

const SectionTitle = ({ title, argoSpec }: { title: string; argoSpec: ArgoCDSpec }) => (
  <Flex>
    <FlexItem spacer={{ default: 'spacerSm' }}>{`${title}:`}</FlexItem>
    <FlexItem>
      <ArgoCDSpecDetails argocdSpec={argoSpec} />
    </FlexItem>
  </Flex>
);

const InstanceParameterField = ({ fieldName }: { fieldName: string }) => {
  const [field] = useField<InstanceParameter>(fieldName);
  const props: FieldProps & { fieldId: string } = {
    name: `${fieldName}.value`,
    label: field.value.title,
    fieldId: fieldName,
  };
  switch (field.value.type) {
    case 'number':
      return <InputField {...props} type={TextInputTypes.number} />;
    case 'string':
      return <InputField {...props} />;
    case 'boolean':
      return <CheckboxField {...props} />;
    case 'integer':
      return <NumberSpinnerField {...props} />;
    default:
      throw `Unsupported parameter type ${field.value.type}`;
  }
};

const InstanceParametersFormFields = ({
  fieldName,
  title,
}: {
  fieldName: string;
  title: string;
}) => {
  const [field] = useField<InstanceParametersFormValues>(fieldName);
  if (field.value.parameters.length === 0) {
    return null;
  }
  return (
    <FormSection title={<SectionTitle title={title} argoSpec={field.value.argoSpec} />}>
      {field.value.parameters.map((param, idx) => {
        const name = `${fieldName}.parameters[${idx}]`;
        return <InstanceParameterField key={name} fieldName={name} />;
      })}
    </FormSection>
  );
};

export default InstanceParametersFormFields;
