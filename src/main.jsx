import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { store } from './store/store';
import { reloadData } from './store/dataSlice';
import { updateProfile } from './store/authSlice';
import { migrateUser } from './utils/migrateUser';
import './styles/global.css';
import './styles/navbar.css';
import './styles/sidebar.css';
import './styles/dashboard.css';
import './styles/forms.css';
import './styles/tables.css';

async function bootstrap() {
  try {
    await store.dispatch(reloadData());
  } catch {
    // Backend is required in API-only mode; UI can still render and show auth errors.
  }
  const boot = store.getState();
  if (boot.auth.user) {
    store.dispatch(
      updateProfile(migrateUser(boot.auth.user, boot.data.faculties))
    );
  }
}

bootstrap();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
