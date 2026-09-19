import { Link, useNavigate } from 'react-router-dom';
import { LoginForm } from '../../components/LoginForm';

export function RouterLoginPage() {
  const navigate = useNavigate();

  return (
    <div className="narrow-page">
      <LoginForm onSuccess={() => navigate('/router/users')} />
      <p className="switch-copy">
        No tenes cuenta? <Link to="/router/register">Registrate</Link>
      </p>
    </div>
  );
}

