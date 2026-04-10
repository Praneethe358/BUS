const latestLocationByBus = new Map();

const normalizeBusId = (busId) => {
  if (busId === undefined || busId === null) {
    return null;
  }
  return busId.toString();
};

const getLatestLocation = (busId) => {
  const key = normalizeBusId(busId);
  if (!key) {
    return null;
  }

  return latestLocationByBus.get(key) || null;
};

const setLatestLocation = (busId, location) => {
  const key = normalizeBusId(busId);
  if (!key || !location) {
    return null;
  }

  latestLocationByBus.set(key, location);
  return location;
};

module.exports = {
  getLatestLocation,
  setLatestLocation,
};
