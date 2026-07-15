/* ============================================================
   MERIDIEL — persistence and conflict-resolution helpers
   Shared by the browser bundle and Vitest as an ES module.
   ============================================================ */
  function changeTime(record) {
    return Math.max(Number(record && record.updatedAt) || 0, Number(record && record.deletedAt) || 0);
  }

  function chooseNewest(a, b) {
    if (!a) return b;
    if (!b) return a;
    var aTime = changeTime(a);
    var bTime = changeTime(b);
    if (aTime !== bTime) return aTime > bTime ? a : b;
    // On an equal timestamp, deletion wins. This prevents a stale live copy
    // from resurrecting a record deleted on another device.
    if (!!a.deletedAt !== !!b.deletedAt) return a.deletedAt ? a : b;
    return a;
  }

  function mergeByFlightId(local, cloud) {
    var byId = new Map();
    (cloud || []).forEach(function (record) {
      if (record && record.id != null) byId.set(record.id, record);
    });
    (local || []).forEach(function (record) {
      if (!record || record.id == null) return;
      byId.set(record.id, chooseNewest(byId.get(record.id), record));
    });
    return Array.from(byId.values());
  }

  function markDeleted(records, id, at) {
    var deletedAt = at || Date.now();
    var found = false;
    var next = (records || []).map(function (record) {
      if (record.id !== id) return record;
      found = true;
      return { id: id, deletedAt: deletedAt, updatedAt: deletedAt };
    });
    // A compact tombstone also lets users hide/delete a flight originating
    // from the bundled atlas rather than from their editable `extra` list.
    if (!found) next.push({ id: id, deletedAt: deletedAt, updatedAt: deletedAt });
    return next;
  }

  function activeRecords(records) {
    return (records || []).filter(function (record) { return record && !record.deletedAt; });
  }

  function deletedIds(records) {
    return new Set((records || []).filter(function (record) { return record && record.deletedAt; }).map(function (record) { return record.id; }));
  }

  function createId() {
    if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") return globalThis.crypto.randomUUID();
    return "flight-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
  }

  function readJson(storage, key, fallback) {
    try {
      var raw = storage.getItem(key);
      return raw == null ? fallback : JSON.parse(raw);
    } catch (error) {
      return fallback;
    }
  }

  function writeJson(storage, key, value) {
    try {
      storage.setItem(key, JSON.stringify(value));
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error };
    }
  }

  export const MeridielData = {
    activeRecords: activeRecords,
    createId: createId,
    deletedIds: deletedIds,
    markDeleted: markDeleted,
    mergeByFlightId: mergeByFlightId,
    readJson: readJson,
    writeJson: writeJson,
  };
