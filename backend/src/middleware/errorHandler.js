export function notFoundHandler(_req, res) {
  res.status(404).json({ error: 'Маршрут не найден' });
}

export function errorHandler(err, _req, res, _next) {
  const status = err.status || 500;
  const message =
    status >= 500
      ? 'Внутренняя ошибка сервера. Попробуйте позже или обратитесь к администратору.'
      : err.message || 'Не удалось выполнить операцию';
  res.status(status).json({ error: message });
}
