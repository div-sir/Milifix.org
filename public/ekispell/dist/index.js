const segmenter = new Intl.Segmenter('ja', { granularity: 'grapheme' });
export function graphemes(text) {
    return Array.from(segmenter.segment(text.normalize('NFC')), part => part.segment);
}
/** Conservative MVP model: ASCII=1 cell; kana/CJK/full-width forms=2 cells.
 * Unsupported glyphs fail explicitly. Actual printer metrics require a verified profile. */
export function cellWidth(glyph) {
    if (/^[\x20-\x7e]$/.test(glyph))
        return 1;
    if (/^[\u3000-\u303f\u3041-\u3096\u309d-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uff01-\uff60]$/u.test(glyph.normalize('NFC')))
        return 2;
    throw new Error(`Unsupported print glyph: ${glyph}`);
}
function positiveInteger(value, name) {
    if (!Number.isInteger(value) || value < 1)
        throw new Error(`${name} must be a positive integer`);
}
export function validateCatalog(stations) {
    if (!Array.isArray(stations))
        throw new Error('Catalog must be an array');
    const stationIds = new Set();
    for (const station of stations) {
        if (!station || typeof station !== 'object' || !Array.isArray(station.labels))
            throw new Error('Invalid station record');
        if (!['id', 'name', 'region', 'operator', 'nameSource'].every(key => typeof station[key] === 'string' && station[key].trim()))
            throw new Error('Station metadata must contain nonempty strings');
        if (!station.id || stationIds.has(station.id))
            throw new Error('Station IDs must be unique and nonempty');
        stationIds.add(station.id);
        if (!station.name || !station.region || !station.operator || !station.nameSource)
            throw new Error('Station metadata is incomplete');
        if (station.lines !== undefined && (!Array.isArray(station.lines) || station.lines.some((l) => !l || typeof l !== 'object' || typeof l.id !== 'string' || typeof l.name !== 'string')))
            throw new Error('Invalid station lines');
        if (station.ic !== undefined) {
            const ic = station.ic;
            if (!ic || !['unknown', 'supported', 'unsupported'].includes(ic.status))
                throw new Error('Invalid IC status');
            if (ic.status !== 'unknown' && (!Array.isArray(ic.cards) || !ic.cards.length || ic.cards.some((c) => typeof c !== 'string' || !c.trim()) ||
                !['source', 'checkedAt', 'scope'].every(k => typeof ic[k] === 'string' && ic[k].trim()) || !/^https:\/\//.test(ic.source) || !/^\d{4}-\d{2}-\d{2}$/.test(ic.checkedAt)))
                throw new Error('IC status requires scoped evidence');
        }
        const labels = new Set();
        for (const label of station.labels) {
            if (!label || typeof label !== 'object' || !['id', 'text', 'profileId'].every(key => typeof label[key] === 'string' && label[key].length > 0))
                throw new Error('Invalid printed label');
            if (label.inference !== undefined && (typeof label.inference !== 'string' || !label.inference.trim() || label.verification !== 'unverified'))
                throw new Error('Inference must remain unverified');
            if (label.evidence !== undefined && typeof label.evidence !== 'string')
                throw new Error('Evidence must be a string');
            if (!label.id || labels.has(label.id) || !label.profileId || !label.text)
                throw new Error('Invalid printed label');
            labels.add(label.id);
            if (!['unverified', 'receipt-verified'].includes(label.verification))
                throw new Error('Invalid verification status');
            if (label.verification === 'receipt-verified' && !label.evidence?.trim())
                throw new Error('Verified labels require evidence');
            graphemes(label.text).forEach(cellWidth);
        }
    }
}
export function findCandidates(character, stations, options) {
    const glyphs = graphemes(character);
    if (glyphs.length !== 1)
        throw new Error('Match exactly one grapheme at a time');
    if (options.column !== undefined && (!Number.isInteger(options.column) || options.column < 0))
        throw new Error('Column must be a nonnegative integer');
    const target = glyphs[0];
    const matches = [];
    for (const station of stations) {
        if (options.region && station.region !== options.region)
            continue;
        if (options.icCard && (station.ic?.status !== 'supported' || !station.ic.cards.includes(options.icCard)))
            continue;
        if (options.icSupportedOnly && station.ic?.status !== 'supported')
            continue;
        for (const label of station.labels) {
            if (label.profileId !== options.profileId || (options.verifiedOnly && label.verification !== 'receipt-verified'))
                continue;
            let column = 0;
            graphemes(label.text).forEach((glyph, graphemeIndex) => {
                if (glyph === target && (options.column === undefined || options.column === column)) {
                    matches.push({ stationId: station.id, stationName: station.name, profileId: label.profileId, labelId: label.id, text: label.text,
                        character: target, graphemeIndex, column, verification: label.verification });
                }
                column += cellWidth(glyph);
            });
        }
    }
    return matches.sort((a, b) => Number(b.verification === 'receipt-verified') - Number(a.verification === 'receipt-verified') || a.column - b.column || a.stationId.localeCompare(b.stationId, 'en') || a.labelId.localeCompare(b.labelId, 'en'));
}
export function matchMessage(message, stations, options) {
    validateCatalog(stations);
    const glyphs = graphemes(message);
    if (glyphs.length > 100)
        throw new Error('Message exceeds 100 graphemes');
    // Preserve spaces and punctuation. A missing character must not silently disappear.
    return glyphs.map(character => ({ character, candidates: findCandidates(character, stations, options) }));
}
export function buildSequence(slots, selections = {}) {
    return slots.map((slot, messageIndex) => {
        const selection = selections[messageIndex] ?? 0;
        if (!Number.isInteger(selection) || selection < 0 || (slot.candidates.length > 0 && selection >= slot.candidates.length) || (slot.candidates.length === 0 && selection !== 0))
            throw new Error('Invalid candidate selection');
        return { messageIndex, character: slot.character, selected: slot.candidates[selection] ?? null };
    });
}
export function renderPreview(sequence, profile, field = 'entry') {
    positiveInteger(profile.maxRows, 'maxRows');
    positiveInteger(profile.fieldCells, 'fieldCells');
    if (!['oldest-first', 'newest-first'].includes(profile.order))
        throw new Error('Invalid print order');
    if (!['entry', 'exit'].includes(field))
        throw new Error('Invalid history field');
    const rows = sequence.map(row => ({ ...row, selected: row.selected ? { ...row.selected } : null }));
    if (rows.some(row => row.selected && row.selected.profileId !== profile.id))
        throw new Error('Candidate belongs to a different print profile');
    const warnings = ['Layout draft only. Opposite stations and travel connections are not planned.'];
    const overflow = rows.length > profile.maxRows;
    const complete = rows.length > 0 && rows.every(row => row.selected !== null);
    if (!complete)
        warnings.push('Some message characters have no selected station, or the message is empty.');
    if (overflow)
        warnings.push(`Message exceeds the profile limit of ${profile.maxRows} rows. No rows were silently removed.`);
    if (rows.some(row => row.selected?.verification === 'unverified'))
        warnings.push('Printed names are unverified. Confirm them with the target printer.');
    if (rows.some(row => row.selected && graphemes(row.selected.text).reduce((n, g) => n + cellWidth(g), 0) > profile.fieldCells))
        warnings.push('A printed name exceeds the field width. No truncation has been assumed.');
    return { field, rows, chronologicalRows: profile.order === 'newest-first' ? [...rows].reverse() : [...rows], complete, overflow, warnings };
}
export { validateProfile, validateBundle } from './catalog.js';
export { createDraft, restoreDraft } from './draft.js';
export { planJourney, validateNetwork } from './routing.js';
export { buildStationApiCatalog } from './stationapi.js';
export { inferPrintedLabel, stationApiIcEligibility } from './ic.js';
