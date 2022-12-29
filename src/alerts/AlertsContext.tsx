import * as React from 'react';
import { useTranslation } from '../hooks/useTranslation';
import find from 'lodash/find';

export type AlertData = {
  title: string;
  message?: string;
};

export type AlertsContextData = {
  alerts: AlertData[];
  addAlert: (alert: AlertData) => void;
};

const AlertsContext = React.createContext<AlertsContextData>(null);

export const AlertsContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [alerts, setAlerts] = React.useState<AlertData[]>([]);

  const addAlert = React.useCallback(
    (alert: AlertData) => {
      const existing = find(alerts, (curAlert) =>
        curAlert.title.localeCompare(alert.title) === 0 && curAlert.message
          ? curAlert.message?.localeCompare(alert.message) === 0
          : true,
      );
      if (alerts.length > 0) {
        console.log('localcompare title', alerts[0].title?.localeCompare(alert.title));
      }
      console.log(alerts, existing, alert);
      if (!existing) {
        setAlerts([...alerts, alert]);
      }
    },
    [alerts],
  );

  return <AlertsContext.Provider value={{ alerts, addAlert }}>{children}</AlertsContext.Provider>;
};

export const useAlerts = (): AlertsContextData => {
  const alertsContext = React.useContext(AlertsContext);
  const { t } = useTranslation();
  if (!alertsContext) {
    throw t('useAlerts can only be used within AlertsContext.Provider');
  }
  return alertsContext;
};
