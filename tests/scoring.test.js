import test from 'node:test';
import assert from 'node:assert/strict';
import { assess, blankProfile, costEstimate, demoProfiles, DIMENSIONS, FIELDS, intakeOptions, invalidFields } from '../src/scoring.js';

const now = new Date('2026-10-21T12:00:00Z');
const samples = demoProfiles(now);
const ready = samples[0].profile;

test('the deck weights sum to 100 and remain 30 / 30 / 20 / 20', () => {
  assert.deepEqual(DIMENSIONS.map(d => d.weight), [30, 30, 20, 20]);
  assert.equal(DIMENSIONS.reduce((n, d) => n + d.weight, 0), 100);
});

test('the three demonstration profiles produce the three promised pathways', () => {
  assert.deepEqual(samples.map(d => assess(d.profile, now).pathway), ['ready', 'prepare', 'pause']);
  assert.deepEqual(samples.map(d => assess(d.profile, now).total), [97, 69, 64]);
});

test('a blank profile has insufficient information and no score', () => {
  const result = assess(blankProfile(), now);
  assert.equal(result.complete, false);
  assert.equal(result.total, null);
  assert.equal(result.missing.length, Object.keys(FIELDS).length);
});

test('every required answer independently prevents a misleading numeric score when omitted', () => {
  for (const key of Object.keys(FIELDS)) {
    const result = assess({ ...ready, [key]: '' }, now);
    assert.equal(result.total, null, key);
    assert.ok(result.missing.includes(key));
  }
});

test('name is optional and does not change the score', () => {
  assert.equal(assess({ ...ready, name: '' }, now).total, assess(ready, now).total);
});

test('zero funds is a valid answer and raises the affordability pathway', () => {
  const result = assess({ ...ready, funds: '0' }, now);
  assert.equal(result.complete, true);
  assert.equal(result.pathway, 'pause');
  assert.equal(result.gap, result.estimate.total);
});

test('invalid numeric and enum values do not produce scores', () => {
  for (const [key, value] of [['grade', '-1'], ['grade', '101'], ['grade', 'no'], ['funds', '-3'], ['funds', 'Infinity'], ['funds', '1001'], ['country', 'Mars'], ['fit', 'nonsense'], ['intake', '2027-99']]) {
    assert.equal(assess({ ...ready, [key]: value }, now).total, null, `${key}: ${value}`);
  }
});

test('an explicit unsure answer is assessed rather than treated as missing', () => {
  const p = { ...ready, fit: 'unsure', work: 'unsure' };
  assert.deepEqual(invalidFields(p), []);
  assert.equal(assess(p, now).pathway, 'pause');
});

test('part-time reliance and an unidentified funding source override a high overall score', () => {
  for (const patch of [{ work: 'yes' }, { work: 'unsure' }, { funding: 'unconfirmed' }]) {
    const result = assess({ ...ready, ...patch }, now);
    assert.ok(result.total >= 75);
    assert.equal(result.pathway, 'pause');
    assert.ok(result.reasons.length > 0);
  }
});

test('funding below the 70% threshold triggers the affordability override', () => {
  const total = costEstimate(ready).total;
  assert.equal(assess({ ...ready, funds: String(total * 0.69) }, now).pathway, 'pause');
  assert.notEqual(assess({ ...ready, funds: String(total * 0.71) }, now).pathway, 'pause');
});

test('increasing arranged funding cannot reduce budget readiness and is capped at 100', () => {
  let last = -1;
  for (const funds of [0, 5, 10, 20, 30, 40, 60, 1000]) {
    const result = assess({ ...ready, funds: String(funds) }, now);
    const score = result.dimensions.find(d => d.key === 'budget').score;
    assert.ok(score >= last && score <= 100);
    last = score;
  }
});

test('a master’s candidate without a near-complete degree needs preparation', () => {
  const result = assess({ ...ready, stage: 'school' }, now);
  assert.equal(result.pathway, 'prepare');
  assert.equal(result.degreeFit, false);
  assert.match(result.eligibility, /Qualification/);
});

test('sample grade mismatches prevent a ready pathway even with a high total', () => {
  const result = assess({ ...ready, grade: '45' }, now);
  assert.ok(result.total >= 75);
  assert.equal(result.pathway, 'prepare');
});

test('the total is the rounded sum of weighted dimension contributions', () => {
  for (const { profile } of samples) {
    const result = assess(profile, now);
    assert.equal(result.total, Math.round(result.dimensions.reduce((sum, d) => sum + d.points, 0)));
    for (const d of result.dimensions) assert.ok(d.score >= 0 && d.score <= 100);
  }
});

test('cost estimates distinguish country, subject and level and contain all three components', () => {
  assert.deepEqual(costEstimate(ready), { tuition: 22, living: 14, buffer: 3.6, total: 39.6 });
  assert.notEqual(costEstimate({ ...ready, country: 'Ireland' }).total, 39.6);
  assert.notEqual(costEstimate({ ...ready, area: 'technology' }).total, 39.6);
  assert.notEqual(costEstimate({ ...ready, level: 'bachelors' }).total, 39.6);
  assert.equal(costEstimate(blankProfile()), null);
});

test('an elapsed intake cannot receive a ready pathway', () => {
  const result = assess({ ...ready, intake: '2025-09' }, now);
  assert.equal(result.months, 0);
  assert.equal(result.pathway, 'prepare');
});

test('a deficient document dimension blocks readiness even with a good total', () => {
  const result = assess({ ...ready, transcripts: 'missing', statement: 'missing', references: 'missing', english: 'not_planned' }, now);
  assert.ok(result.total >= 75);
  assert.equal(result.pathway, 'prepare');
});

test('intake options are future dates and regenerate over year boundaries', () => {
  for (const date of [now, new Date('2026-12-31'), new Date('2027-09-01')]) {
    const options = intakeOptions(date);
    assert.equal(options.length, 5);
    assert.ok(options.every(v => new Date(`${v}-01`) > date));
  }
});
