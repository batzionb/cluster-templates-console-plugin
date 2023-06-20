import { Meta, StoryObj } from '@storybook/react';
import { Formik } from 'formik';
import React from 'react';
import { TFunction } from 'react-i18next';
import { SchemaOf } from 'yup';
import { nameSchema } from '../../utils/commonValidationSchemas';
import * as yup from 'yup';
import NameField from './NameField';
import { Form, SelectPosition } from '@patternfly/react-core';
import { userEvent, within, screen } from '@storybook/testing-library';
import { expect } from '@storybook/jest';
import { getRichTextValidation } from '../../utils/commonValidationSchemas';

// Function to emulate pausing between interactions
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const NameFieldWrapper = ({ initialName }: { initialName: string }) => {
  const tFunction: TFunction = (text: string) => text;
  const validationSchema = React.useMemo<SchemaOf<{ name: string }>>(() => {
    return yup.object().shape({
      name: yup.string().concat(nameSchema(tFunction)).required('Required'),
    });
  }, []);
  return (
    <Formik
      initialValues={{ name: initialName }}
      onSubmit={(values) => console.log(values)}
      validateOnMount
      initialTouched={{ name: true }}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      validate={getRichTextValidation<any>(validationSchema)}
    >
      <Form>
        <NameField name="name" label="name" />
      </Form>
    </Formik>
  );
};

const meta: Meta<typeof NameFieldWrapper> = {
  title: 'NameField',
  component: NameFieldWrapper,
};

export default meta;
type Story = StoryObj<typeof NameFieldWrapper>;

export const ValidName: Story = {
  args: {
    initialName: '',
  },
};

export const InvalidFirstChar: Story = {
  args: {
    initialName: 'Invalid-first-chart',
  },
};

export const InvalidCharacters: Story = {
  args: {
    initialName: '',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const nameField = canvas.getByRole('textbox', { name: /name/ });
    console.log(nameField);
    await userEvent.type(nameField, '&&&aaa', {
      delay: 100,
    });
    const popover = screen.getByTestId('validation-popover');

    const popoverElement = within(popover);

    await expect(
      popoverElement.getByRole('alert', {
        name: /must start and end with an lowercase alphanumeric character/i,
      }),
    ).toBeTruthy();
    console.log(111);
    await expect(
      popoverElement.getByRole('alert', {
        name: 'Use lowercase alphanumeric characters, dot (.) or hyphen (-)',
      }),
    ).toBeTruthy();
  },
};
