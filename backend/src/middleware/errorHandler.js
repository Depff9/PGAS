export function notFoundHandler(_req, res) {
  res.status(404).json({ error: 'Маршрут не найден' });
}

export function errorHandler(err, _req, res, _next) {
  const status = err.status || 500;
  const message = err.message || 'Внутренняя ошибка сервера';
  res.status(status).json({ error: message });
}
