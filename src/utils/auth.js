import { loginSuccess, loginFailure } from '../store/authSlice';
import { setUsers } from '../store/dataSlice';
import { ROLES } from '../mock/users';
import { migrateUser } from './migrateUser';

export function authenticate(dispatch, users, email, password, faculties = []) {
  const normalized = email.trim().toLowerCase();
  const found = users.find(
    (u) => u.email.toLowerCase() === normalized && u.password === password
  );
  if (!found) {
    dispatch(loginFailure('Неверный email или пароль'));
    return false;
  }
  const safeUser = { ...migrateUser(found, faculties) };
  delete safeUser.password;
  dispatch(loginSuccess(safeUser));
  return true;
}

export function registerUser(dispatch, users, form, faculties = []) {
  const email = form.email.trim().toLowerCase();
  if (users.some((u) => u.email.toLowerCase() === email)) {
    return { ok: false, error: 'Пользователь с таким email уже существует' };
  }
  const newUser = migrateUser(
    {
      id: 'u' + Date.now(),
      email,
      password: form.password,
      role: ROLES.STUDENT,
      lastName: form.lastName.trim(),
      firstName: form.firstName.trim(),
      middleName: form.middleName.trim(),
      facultyId: null,
      group: null,
      recordBookNumber: null,
      studentCardNumber: null,
    },
    faculties
  );
  const updated = [...users, newUser];
  dispatch(setUsers(updated));
  const safeUser = { ...newUser };
  delete safeUser.password;
  dispatch(loginSuccess(safeUser));
  return { ok: true };
}
