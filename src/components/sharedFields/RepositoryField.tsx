import * as React from 'react';
import {
  FormGroup,
  Select,
  SelectVariant,
  SelectOption,
  SelectProps,
  ValidatedOptions,
  Button,
} from '@patternfly/react-core';
import { useField } from 'formik';
import { useAlerts } from '../../alerts/AlertsContext';
import { useTranslation } from '../../hooks/useTranslation';
import { PlusIcon } from '@patternfly/react-icons';
import NewRepositoryDialog from '../HelmRepositories/NewRepositoryDialog';
import CellLoader from '../../helpers/CellLoader';
import { RepositoryType } from '../../types/resourceTypes';
import { useArgoCDSecrets } from '../../hooks/useArgoCDSecrets';
import { useAddAlertOnError } from '../../alerts/useAddAlertOnError';
import { humanizeUrl } from '../../utils/humanizing';

type HelmRepositoryFieldProps = {
  fieldName: string;
  labelIcon?: React.ReactElement;
  label: string;
  type: RepositoryType;
  error?: string;
};

const RepositoryField = ({
  fieldName,
  labelIcon,
  label,
  type,
  error,
}: HelmRepositoryFieldProps) => {
  const { addAlert } = useAlerts();
  const { t } = useTranslation();
  const [{ value: url }, { touched, error: formError }, { setValue, setTouched }] =
    useField<string>(fieldName);
  const [isOpen, setIsOpen] = React.useState<boolean>(false);
  const [repos, loaded, reposLoadError] = useArgoCDSecrets();
  const [newRepositoryDialogOpen, setNewRepositoryDialogOpen] = React.useState(false);
  const [selectedRepoName, setSelectedRepoName] = React.useState<string>('');
  // t('Failed to load repository secrets')
  useAddAlertOnError(reposLoadError, 'Failed to load repository Secrets');
  const errorMsg = formError || error;

  React.useEffect(() => {
    //initialize selected repo name
    if (!loaded || selectedRepoName) {
      return;
    }
    if (url) {
      const repo = repos.find((repo) => repo.data.url === url);
      if (!repo) {
        // t('Failed to find the selected repository')
        addAlert({
          title: 'Failed to find the selected repository',
          message: `Failed to find a Secret matching the label argocd.argoproj.io/secret-type for accessing URL ${humanizeUrl(
            url,
          )}. Use 'Add a repository' to create a Secret with this URL`,
        });
        setValue('');
      } else {
        setSelectedRepoName(repo.data.name || '');
      }
    } else if (repos.length === 1) {
      setValue(repos[0].data.url || '');
      setSelectedRepoName(repos[0].data.name || '');
    }
  }, [addAlert, loaded, selectedRepoName, setValue, url, setSelectedRepoName, repos]);

  const onNewRepoCreated = (name: string, url: string) => {
    setSelectedRepoName(name);
    setValue(url, true);
  };

  const onSelect: SelectProps['onSelect'] = (_, value) => {
    const repo = repos.find((repo) => repo.data.name === value);
    if (!repo) {
      // t('Failed to find the selected repository')
      addAlert({
        title: 'Failed to find the selected repository',
        message: `Failed to find repository secret ${value.toString()}`,
      });
      setValue('');
    } else {
      setValue(repo.data.url || '', true);
    }
    setSelectedRepoName(value as string);
    setIsOpen(false);
  };

  const validated = touched && errorMsg ? ValidatedOptions.error : ValidatedOptions.default;
  const repoNames = repos
    .filter((repo) => repo.data.type === type)
    .map((repo) => repo.data.name)
    .sort((name1, name2) => name1?.localeCompare(name2 || '') || 0);

  return (
    <FormGroup
      fieldId={fieldName}
      validated={validated}
      label={label}
      helperTextInvalid={errorMsg}
      isRequired={true}
      labelIcon={labelIcon}
    >
      <CellLoader loaded={loaded} fontSize="2xl">
        <Select
          name="fieldName"
          variant={SelectVariant.typeahead}
          validated={validated}
          onToggle={() => setIsOpen(!isOpen)}
          onSelect={onSelect}
          isOpen={isOpen}
          selections={selectedRepoName}
          typeAheadAriaLabel={t('Type a repository name')}
          placeholderText={t('Select a repository')}
          toggleId={fieldName}
          isDisabled={!!reposLoadError}
          maxHeight={200}
          onBlur={() => setTouched(true, true)}
          footer={
            <Button
              variant="link"
              onClick={() => setNewRepositoryDialogOpen(true)}
              icon={<PlusIcon />}
              style={{ paddingLeft: 'unset' }}
            >
              {t('Add another repository URL')}
            </Button>
          }
        >
          {repoNames.map((name) => {
            return <SelectOption value={name} isDisabled={false} key={name} name={name} />;
          })}
        </Select>
      </CellLoader>
      {newRepositoryDialogOpen && (
        <NewRepositoryDialog
          closeDialog={() => setNewRepositoryDialogOpen(false)}
          afterCreate={onNewRepoCreated}
          predefinedType={type}
        />
      )}
    </FormGroup>
  );
};

export default RepositoryField;
