import { load } from 'js-yaml';
import React from 'react';
import {
  InstanceFormValues,
  InstanceParametersFormValues,
  InstanceParameter,
  isPrimitiveValue,
  SupportedJsonSchemaType,
  isSupportedJson7SchemaType,
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

    const getParametersFromSchema = (schema: string, valuesStr?: string) => {
      const parameters: InstanceParameter[] = [];
      const values = valuesStr ? (load(valuesStr) as object) : {};
      const jsonSchema = load(schema) as JSONSchema7;
      for (const [key, paramSchema] of Object.entries(jsonSchema.properties || {})) {
        if (typeof paramSchema === 'boolean') {
          // there's no use case for this
          continue;
        }
        if (!isSupportedJson7SchemaType(paramSchema.type)) {
          hasUnsupportedParameters = true;
          continue;
        }
        const value: unknown = values[key] ? values[key] : paramSchema.default;
        if (!isPrimitiveValue(value)) {
          hasUnsupportedParameters = true;
          continue;
        } else {
          parameters.push({
            name: key,
            value,
            required: jsonSchema.required?.includes(key) || false,
            type: paramSchema.type || SupportedJsonSchemaType.STRING,
            description: jsonSchema.description,
            title: paramSchema.title || key,
          });
        }
      }
      return parameters;
    };

    const getParametersFromValues = (valuesStr?: string): InstanceParameter[] => {
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
          const type = typeof value as SupportedJsonSchemaType;
          parameters.push({ name, value, type, required: false, title: name });
        }
      }
      return parameters.sort((param1, param2) => param1.name.localeCompare(param2.name));
    };

    const getParameters = (values?: string, schema?: string): InstanceParameter[] => {
      return schema ? getParametersFromSchema(schema, values) : getParametersFromValues(values);
    };

    const getPostInstallationItemFormValues = (
      template: ClusterTemplate,
      name: string,
      values?: string,
      schema?: string,
    ) => {
      const clusterSetupSpec = template.spec.clusterSetup?.find((setup) => setup.name === name);
      if (!clusterSetupSpec) {
        throw new Error(
          `Post installation status contains invalid setup ${name}. This setup doesn't existing in the template spec.`,
        );
      }
      return {
        parameters: getParameters(values, schema),
        argoSpec: clusterSetupSpec.spec,
        name: name,
      };
    };

    const getPostInstallationFormValues = (
      template: ClusterTemplate,
      setupStatus: ClusterTemplateSetupStatus,
    ): InstanceParametersFormValues[] => {
      return setupStatus.reduce<InstanceParametersFormValues[]>(
        (prev: InstanceParametersFormValues[], setup) => {
          const formValues = getPostInstallationItemFormValues(
            template,
            setup.name,
            setup.values,
            setup.schema,
          );
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
      const _formValues = toInstanceFormValues(template);
      console.log(_formValues);
      setFormValues(_formValues);
    } catch (err) {
      setError(err);
    }
  }, [template, loaded, templateLoadError, formValues]);
  return [formValues, error];
};
