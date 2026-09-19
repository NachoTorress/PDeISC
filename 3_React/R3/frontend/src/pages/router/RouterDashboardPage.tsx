import { UserDashboard } from '../../components/UserDashboard';

export function RouterDashboardPage() {
  return (
    <UserDashboard
      title="Sistema con React Router"
      description="Esta version separa login, registro y panel mediante rutas protegidas."
    />
  );
}

