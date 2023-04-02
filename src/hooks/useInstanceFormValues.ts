import { load } from 'js-yaml';
import React from 'react';
import {
  InstanceFormValues,
  InstanceParametersFormValues,
  InstanceParameter,
  isPrimitiveValue,
} from '../types/instanceFormTypes';
import { ClusterTemplate, ClusterTemplateSetupStatus } from '../types/resourceTypes';
import { JSONSchema7 } from 'json-schema';

export const useInstanceFormValues = (
  templateLoadResult: [ClusterTemplate, boolean, unknown],
): [InstanceFormValues | undefined, unknown] => {
  const [error, setError] = React.useState<unknown>();
  const [formValues, setFormValues] = React.useState<InstanceFormValues>();
  const [template, loaded, templateLoadError] = templateLoadResult;
  // eslint-disable-next-line @typescript-eslint/ban-types

  React.useEffect(() => {
    let hasUnsupportedParameters = false;
    const getParameters = (name: string, valuesStr?: string): InstanceParameter[] => {
      try {
        if (!valuesStr) {
          return [];
        }
        let valuesObject = {};
        if (valuesStr) {
          valuesObject = load(valuesStr) as Record<string, unknown>;
        }
        const parameters: InstanceParameter[] = [];
        for (const [name, value] of Object.entries(valuesObject)) {
          if (!isPrimitiveValue(value)) {
            hasUnsupportedParameters = true;
          } else {
            parameters.push({ name, value, defaultValue: value });
          }
        }
        return parameters.sort((param1, param2) => param1.name.localeCompare(param2.name));
      } catch (err) {
        throw new Error(`Failed to parse cluster template status values of ${name}`);
      }
    };

    const getPostInstallationItemFormValues = (
      template: ClusterTemplate,
      name: string,
      values?: string,
      schema?: string,
    ): InstanceParametersFormValues | undefined => {
      if (!values) {
        return undefined;
      }
      const clusterSetupSpec = template.spec.clusterSetup?.find((setup) => setup.name === name);
      if (!clusterSetupSpec) {
        throw new Error(
          `Post installation status contains invalid setup ${name}. This setup doesn't existing in the template spec.`,
        );
      }
      return {
        parameters: getParameters(name, values),
        argoSpec: clusterSetupSpec.spec,
        name: name,
        schema: schema ? (load(schema) as JSONSchema7) : undefined,
      };
    };

    const getPostInstallationFormValues = (
      template: ClusterTemplate,
      setupStatus: ClusterTemplateSetupStatus,
    ): InstanceParametersFormValues[] => {
      return setupStatus.reduce<InstanceParametersFormValues[]>(
        (prev: InstanceParametersFormValues[], setup) => {
          const formValues = getPostInstallationItemFormValues(template, setup.name, setup.values);
          return formValues ? [...prev, formValues] : prev;
        },
        [],
      );
    };

    const toInstanceFormValues = (template: ClusterTemplate): InstanceFormValues => {
      return {
        name: '',
        namespace: '',
        installation: {
          parameters: template.status?.clusterDefinition
            ? getParameters('installation', template.status?.clusterDefinition.values)
            : [],
          argoSpec: template.spec.clusterDefinition,
          schema: template.status?.clusterDefinition?.schema
            ? (load(template.status?.clusterDefinition?.schema) as JSONSchema7)
            : undefined,
        },
        postInstallation: template.status?.clusterSetup
          ? getPostInstallationFormValues(template, template.status?.clusterSetup)
          : [],
        hasUnsupportedParameters,
      };
    };
    try {
      if (!loaded || templateLoadError || formValues) {
        return;
      }
      console.log(template);
      const _formValues = toInstanceFormValues(template);
      console.log(_formValues);
      setFormValues(_formValues);
    } catch (err) {
      setError(err);
    }
  }, [template, loaded, templateLoadError, formValues]);
  return [formValues, error];
};
