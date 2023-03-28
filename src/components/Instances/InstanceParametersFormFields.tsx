import { Flex, FlexItem } from '@patternfly/react-core';
import { useField } from 'formik';
import { InputField } from 'formik-pf';
import React from 'react';
import FormSection from '../../helpers/FormSection';
import { InstanceParametersFormValues } from '../../types/instanceFormTypes';
import { ArgoCDSpec } from '../../types/resourceTypes';
import ArgoCDSpecDetails from '../sharedDetailItems/ArgoCDSpecDetails';

const SectionTitle = ({ title, argoSpec }: { title: string; argoSpec: ArgoCDSpec }) => (
  <Flex>
    <FlexItem spacer={{ default: 'spacerSm' }}>{`${title}:`}</FlexItem>
    <FlexItem>
      <ArgoCDSpecDetails argocdSpec={argoSpec} />
    </FlexItem>
  </Flex>
);

const InstanceParametersFormFields = ({
  fieldName,
  title,
}: {
  fieldName: string;
  title: string;
}) => {
  const [field] = useField<InstanceParametersFormValues>(fieldName);
  console.log(fieldName, field.value.parameters);
  if (field.value.parameters.length === 0) {
    return null;
  }
  console.log('adding form section');
  return (
    <FormSection title={<SectionTitle title={title} argoSpec={field.value.argoSpec} />}>
      {field.value.parameters.map((param, idx) => {
        const name = `${fieldName}.parameters[${idx}]`;
        return <InputField key={name} name={`${name}.value`} label={param.name} fieldId={name} />;
      })}
    </FormSection>
  );
};

export default InstanceParametersFormFields;
