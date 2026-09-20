import { Link, useNavigate } from 'react-router-dom';
import { LoginForm } from '../../components/LoginForm';

export function RouterLoginPage() {
  const navigate = useNavigate();

  return (
    <div className="narrow-page">
      <LoginForm onSuccess={() => navigate('/users')} />
      <p className="switch-copy">
        ¿No tenés cuenta? <Link to="/register">Registrate</Link>
      </p>
    </div>
  );
}
