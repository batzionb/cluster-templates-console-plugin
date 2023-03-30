import React from 'react';
import { HelmRepository } from '../../types/resourceTypes';
import get from 'lodash/get';
import { useFormikContext } from 'formik';
import { useHelmChartRepositories } from '../../hooks/useHelmChartRepositories';
import RepositoryField from './RepositoryField';
import { useTranslation } from '../../hooks/useTranslation';
import SelectField from '../../helpers/SelectField';
import { Flex, FlexItem, SelectOptionObject } from '@patternfly/react-core';
import { useAlerts } from '../../alerts/AlertsContext';
import { getErrorMessage } from '../../utils/utils';
import { WizardFormikValues } from '../../types/wizardFormTypes';
import set from 'lodash/set';
import PopoverHelpIcon from '../../helpers/PopoverHelpIcon';
import { humanizeErrorMsg } from '../../utils/humanizing';
const WithFlex = ({ flexItems }: { flexItems: React.ReactNode[] }) => {
  return (
    <Flex>
      {flexItems.map((item, index) => (
        <FlexItem key={index} grow={{ default: 'grow' }}>
          {item}
        </FlexItem>
      ))}
    </Flex>
  );
};

const getChartToVersions = (repo?: HelmRepository): Record<string, string[]> | undefined => {
  if (!repo || !repo.index || repo.error) {
    return undefined;
  }
  const map: Record<string, string[]> = {};
  for (const [key, charts] of Object.entries(repo.index.entries)) {
    map[key] = charts
      .map((chart) => chart.version)
      .sort((v1, v2) => v2.localeCompare(v1, undefined, { numeric: true }));
  }
  return map;
};

const getChartFirstVersion = (
  chart: string,
  chartToVersions: Record<string, string[]> | undefined,
): string => {
  if (!chartToVersions?.[chart]?.length) {
    return '';
  }
  return chartToVersions[chart][0];
};

const HelmFields = ({ fieldName, horizontal }: { fieldName: string; horizontal: boolean }) => {
  const { t } = useTranslation();
  const { addAlert } = useAlerts();
  const { values, setValues } = useFormikContext<WizardFormikValues>();
  const { repos, loaded, error } = useHelmChartRepositories();
  const prevUrl = React.useRef<string>();

  const chartFieldName = `${fieldName}.chart`;
  const versionFieldName = `${fieldName}.version`;
  const repoFieldName = `${fieldName}.url`;
  const url = get(values, repoFieldName) as string;
  const selectedRepo = url ? repos.find((repo) => repo.url === url) : undefined;
  const chartToVersions = React.useMemo(() => getChartToVersions(selectedRepo), [selectedRepo]);
  const chart = get(values, chartFieldName) as string;

  const getRepoErrorMsg = () => {
    if (!loaded || !url || error) {
      return undefined;
    }
    if (!selectedRepo) {
      return t(`Failed to retrieve the Helm repository index of '{{url}}'`, { url: url });
    }
    return selectedRepo.error ? humanizeErrorMsg(selectedRepo.error) : undefined;
  };

  React.useEffect(() => {
    if (error) {
      // t('Failed to load the Helm repository indexes')
      addAlert({
        title: 'Failed to load the Helm repository indexes',
        message: getErrorMessage(error),
      });
    }
  }, [addAlert, error]);

  const updateChart = React.useCallback(
    (chart: string) => {
      const newValues = { ...values };
      set(newValues, chartFieldName, chart);
      set(newValues, versionFieldName, getChartFirstVersion(chart, chartToVersions));
      setValues(newValues);
    },
    [values, versionFieldName, chartToVersions, setValues, chartFieldName],
  );

  React.useEffect(() => {
    //respond to repository selection
    if (prevUrl.current && url !== prevUrl.current) {
      const charts = chartToVersions ? Object.keys(chartToVersions) : [];
      if (charts.length === 1) {
        updateChart(charts[0]);
      } else {
        updateChart('');
      }
    }
    prevUrl.current = url;
  }, [updateChart, url, prevUrl, chartToVersions]);

  const fields = [
    <RepositoryField
      fieldName={`${fieldName}.url`}
      key={`${fieldName}.url`}
      label={t('Helm chart repository')}
      labelIcon={
        !horizontal ? (
          <PopoverHelpIcon
            helpText={t(
              'Select the Helm chart repository that contains the Helm Chart you would like to use for this cluster template.',
            )}
          />
        ) : undefined
      }
      type="helm"
      error={getRepoErrorMsg()}
    />,
    <SelectField
      name={chartFieldName}
      options={
        chartToVersions
          ? Object.keys(chartToVersions).sort((key1, key2) => key1.localeCompare(key2))
          : []
      }
      isRequired
      label={t('Helm chart')}
      isDisabled={!chartToVersions}
      key={chartFieldName}
      placeholderText={!chartToVersions ? t('Select a repository first') : t('Select a chart')}
      onSelectValue={(chart: string | SelectOptionObject) => {
        updateChart(chart as string);
      }}
      loaded={loaded}
    />,
    <SelectField
      name={versionFieldName}
      label={t('Helm chart version')}
      key={versionFieldName}
      isDisabled={!chartToVersions || !chart}
      options={chart && chartToVersions && chartToVersions[chart] ? chartToVersions[chart] : []}
      isRequired
      placeholderText={
        !selectedRepo ? t('Select a repository first') : !chart ? t('Select a chart first') : ''
      }
      loaded={loaded}
    />,
  ];
  return horizontal ? <WithFlex flexItems={fields} /> : <>{fields}</>;
};

export default HelmFields;
