import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
      <div className="container">
        <Link className="navbar-brand" to="/dashboard">
          <span className="me-2">🎯</span>
          LifePlanning
        </Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link className="nav-link" to="/dashboard">
                <i className="bi bi-speedometer2 me-1"></i>
                Dashboard
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/goals">
                <i className="bi bi-bullseye me-1"></i>
                Goals
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/habits">
                <i className="bi bi-check-circle me-1"></i>
                Habits
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/budgets">
                <i className="bi bi-wallet2 me-1"></i>
                Budget
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/immigration">
                <i className="bi bi-globe-americas me-1"></i>
                移民顾问
              </Link>
            </li>
          </ul>
          <ul className="navbar-nav">
            <li className="nav-item dropdown">
              <a className="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                <span className="me-1">👤</span>
                {user.name}
              </a>
              <ul className="dropdown-menu dropdown-menu-end">
                <li><span className="dropdown-item-text text-muted">{user.email}</span></li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <button className="dropdown-item text-danger" onClick={handleLogout}>
                    <i className="bi bi-box-arrow-right me-2"></i>
                    Logout
                  </button>
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
