const axios = require('axios');
const logger = require('../utils/logger');

const ALLOWED_HOSTS = ['archive.org'];

/**
 * GET /api/proxy/text?url=...
 * Fetches a plain-text file from an allowlisted host and returns it.
 * Avoids CORS issues when the browser fetches text files for the in-app reader.
 */
async function proxyText(req, res, next) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: { message: 'url query parameter is required', status: 400 } });
  }

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return res.status(400).json({ error: { message: 'Invalid URL', status: 400 } });
  }

  const isAllowed = ALLOWED_HOSTS.some((host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`));
  if (!isAllowed) {
    return res.status(403).json({ error: { message: 'URL host is not allowlisted', status: 403 } });
  }

  logger.debug(`[proxyController] fetching text: ${url}`);

  try {
    const response = await axios.get(url, {
      responseType: 'text',
      timeout: 20000,
      maxContentLength: 10 * 1024 * 1024, // 10 MB cap
    });

    res.set('Content-Type', 'text/plain; charset=utf-8');
    res.send(response.data);
  } catch (err) {
    if (err.response?.status === 404) {
      return res.status(404).json({ error: { message: 'Text file not found', status: 404 } });
    }
    next(err);
  }
}

module.exports = { proxyText };
