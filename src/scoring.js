// The deck supplies the dimensions and weights. Sub-scores, cost examples,
// programme benchmarks and pathway thresholds below are transparent demo assumptions.
export const DIMENSIONS = [
  { key: 'academic', name: 'Academic fit', weight: 30, color: '#3261ed', short: 'Your programme fit' },
  { key: 'budget', name: 'Budget preparedness', weight: 30, color: '#20a784', short: 'Your funding picture' },
  { key: 'documents', name: 'Documentation readiness', weight: 20, color: '#9775dc', short: 'Your application toolkit' },
  { key: 'timeline', name: 'Timeline readiness', weight: 20, color: '#e4a044', short: 'Your next steps, in time' },
];

export const AREAS = {
  business: { name: 'Business & management', tuition: { UK: 22, Ireland: 18 }, grade: 60 },
  technology: { name: 'Technology & data', tuition: { UK: 24, Ireland: 20 }, grade: 65 },
  engineering: { name: 'Engineering & science', tuition: { UK: 23, Ireland: 19 }, grade: 65 },
  creative: { name: 'Arts & creative studies', tuition: { UK: 20, Ireland: 17 }, grade: 60 },
};

export const DOCS = [
  ['transcripts', 'Academic transcripts', 'Your marksheets and degree records'],
  ['statement', 'Statement of purpose', 'Why this course, and why you'],
  ['references', 'Academic references', 'Identify who can recommend you'],
  ['cv', 'CV / résumé', 'Your education and experience'],
  ['passport', 'Passport readiness', 'Status only — no document needed'],
];

export const OPTIONS = {
  country: ['UK', 'Ireland'], level: ['masters', 'bachelors'], area: Object.keys(AREAS),
  stage: ['school', 'studying', 'final_year', 'graduated'],
  research: ['none', 'exploring', 'shortlisted', 'checked'],
  fit: ['related', 'transferable', 'unrelated', 'unsure'],
  funding: ['unconfirmed', 'exploring', 'applied', 'confirmed'],
  costs: ['tuition', 'tuition_living', 'all'], work: ['yes', 'no', 'unsure'],
  transcripts: ['missing', 'identified', 'preparing', 'ready'],
  statement: ['missing', 'identified', 'preparing', 'ready'],
  references: ['missing', 'identified', 'preparing', 'ready'],
  cv: ['missing', 'identified', 'preparing', 'ready'],
  passport: ['missing', 'identified', 'preparing', 'ready'],
  english: ['not_planned', 'planned', 'booked', 'completed'],
  deadlines: ['unknown', 'identified', 'mapped'], nextsteps: ['none', 'rough', 'dated'],
};

export const FIELDS = {
  country: ['Destination', 0], level: ['Study level', 0], area: ['Subject area', 0],
  stage: ['Current education stage', 0], intake: ['Target intake', 0],
  grade: ['Academic percentage', 1], research: ['Programme research', 1], fit: ['Subject background', 1],
  funds: ['Available funding', 2], funding: ['Funding status', 2], costs: ['Cost planning', 2], work: ['Part-time work reliance', 2],
  transcripts: ['Transcripts status', 3], statement: ['Statement of purpose status', 3], references: ['References status', 3],
  cv: ['CV status', 3], passport: ['Passport readiness', 3], english: ['English-language preparation', 3],
  deadlines: ['Deadline planning', 3], nextsteps: ['Next-step planning', 3],
};

export function blankProfile() { return { name: '', ...Object.fromEntries(Object.keys(FIELDS).map(k => [k, ''])) }; }

export function intakeOptions(now = new Date()) {
  const options = [];
  for (let y = now.getFullYear(); y <= now.getFullYear() + 3; y++) {
    for (const m of ['01', '09']) {
      const value = `${y}-${m}`;
      if (new Date(`${value}-01T00:00:00Z`) > now) options.push(value);
    }
  }
  return options.slice(0, 5);
}

export const intakeLabel = value => /^\d{4}-(01|09)$/.test(value || '') ? `${value.endsWith('01') ? 'January' : 'September'} ${value.slice(0, 4)}` : 'Intake to be decided';
export const money = n => `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 1 })}L`;

export function invalidFields(p) {
  return Object.keys(FIELDS).filter(key => {
    const v = p[key];
    if (v === '' || v === null || v === undefined) return true;
    if (key === 'grade') return !Number.isFinite(Number(v)) || Number(v) < 0 || Number(v) > 100;
    if (key === 'funds') return !Number.isFinite(Number(v)) || Number(v) < 0 || Number(v) > 1000;
    if (key === 'intake') return !/^\d{4}-(01|09)$/.test(v);
    return !OPTIONS[key]?.includes(v);
  });
}

export function costEstimate(p) {
  if (!AREAS[p.area] || !OPTIONS.country.includes(p.country) || !OPTIONS.level.includes(p.level)) return null;
  const tuition = Math.round(AREAS[p.area].tuition[p.country] * (p.level === 'bachelors' ? 0.85 : 1) * 10) / 10;
  const living = p.country === 'UK' ? 14 : 12;
  const buffer = Math.round((tuition + living) * 0.1 * 10) / 10;
  return { tuition, living, buffer, total: Math.round((tuition + living + buffer) * 10) / 10 };
}

export function assess(p, now = new Date()) {
  const missing = invalidFields(p);
  if (missing.length) return { complete: false, missing, total: null, pathway: 'incomplete', title: 'Insufficient information', description: 'A little more detail will make this scorecard meaningful. Complete the highlighted fields to see your FatehScore.' };
  const estimate = costEstimate(p);
  const benchmark = AREAS[p.area].grade;
  const gradeFit = Math.min(1, Number(p.grade) / benchmark) * 40;
  const degreeFit = p.level === 'bachelors' || ['final_year', 'graduated'].includes(p.stage);
  const academic = Math.round((gradeFit + ({ none: 0, exploring: 12, shortlisted: 25, checked: 35 })[p.research] + ({ related: 25, transferable: 17, unrelated: 5, unsure: 0 })[p.fit]) * (degreeFit ? 1 : 0.65));
  const coverage = Number(p.funds) / estimate.total;
  const budget = Math.round(Math.min(1, coverage) * 60 + ({ tuition: 0, tuition_living: 12, all: 20 })[p.costs] + ({ unconfirmed: 0, exploring: 5, applied: 12, confirmed: 20 })[p.funding]);
  const docValues = { missing: 0, identified: 0.35, preparing: 0.65, ready: 1 };
  const documents = Math.round(DOCS.reduce((sum, [key]) => sum + docValues[p[key]] * 15, 0) + ({ not_planned: 0, planned: 9, booked: 17, completed: 25 })[p.english]);
  const target = new Date(`${p.intake}-01T00:00:00Z`);
  const months = Math.max(0, (target - now) / (1000 * 60 * 60 * 24 * 30.44));
  const horizon = months >= 9 ? 40 : months >= 6 ? 32 : months >= 3 ? 20 : months > 0 ? 8 : 0;
  const timeline = horizon + ({ unknown: 0, identified: 15, mapped: 30 })[p.deadlines] + ({ none: 0, rough: 15, dated: 30 })[p.nextsteps];
  const scores = { academic, budget, documents, timeline };
  const dimensions = DIMENSIONS.map(d => ({ ...d, score: scores[d.key], points: Math.round(scores[d.key] * d.weight / 10) / 10 }));
  const total = Math.round(dimensions.reduce((sum, d) => sum + d.points, 0));
  const affordabilityRisk = coverage < 0.7 || p.funding === 'unconfirmed' || p.work !== 'no';
  const ready = total >= 75 && Object.values(scores).every(n => n >= 60) && degreeFit && Number(p.grade) >= benchmark && target > now;
  const pathway = affordabilityRisk ? 'pause' : ready ? 'ready' : 'prepare';
  const titles = { ready: 'Ready to plan', prepare: 'Needs preparation', pause: 'Pause & verify affordability' };
  const descriptions = {
    ready: 'You have a strong planning foundation. Take your shortlist and funding plan to a counsellor to verify the details.',
    prepare: 'Your next chapter is taking shape. Close the gaps below to move forward with a more confident plan.',
    pause: 'Give your funding plan a closer look before committing. Start with costs, dependable funding, and the gap to cover.',
  };
  const eligibility = !degreeFit ? 'Qualification needs review' : Number(p.grade) < benchmark ? 'Below the sample grade benchmark' : p.fit === 'unrelated' || p.fit === 'unsure' ? 'Subject fit needs review' : 'Sample academic checks aligned';
  const reasons = [];
  if (coverage < 0.7) reasons.push('Arranged funding covers less than 70% of the sample first-year cost.');
  if (p.funding === 'unconfirmed') reasons.push('A funding source has not been confirmed.');
  if (p.work !== 'no') reasons.push('Part-time earnings are needed or their role is unclear.');
  const notes = {
    academic: `${eligibility}. ${p.research === 'checked' ? 'You have reviewed programme requirements.' : 'Verify entry requirements for each shortlisted programme.'}`,
    budget: `${Math.round(coverage * 100)}% of the illustrative first-year cost is covered by your stated funding. ${p.funding === 'confirmed' ? 'Funding is self-reported as confirmed.' : 'Your funding is still being arranged.'}`,
    documents: `${DOCS.filter(([k]) => p[k] === 'ready').length} of 5 document tasks are ready. ${p.english === 'completed' ? 'Your language-test task is marked complete; verify course-specific requirements.' : 'Your language-test task still needs preparation.'}`,
    timeline: `${Math.floor(months)} months until your intended intake. ${p.deadlines === 'mapped' && p.nextsteps === 'dated' ? 'You have mapped deadlines and dated actions.' : 'Map application deadlines and give each next step a date.'}`,
  };
  const actions = [];
  const add = (title, detail, timing, dimension) => actions.push({ title, detail, timing, dimension });
  if (affordabilityRisk || budget < 80) add('Make your funding plan concrete', `Review the ${money(estimate.total)} sample first-year budget with your family. ${coverage < 1 ? `Identify how to cover the ${money(Math.max(0, estimate.total - Number(p.funds)))} gap. ` : ''}Confirm loan or scholarship terms before counting them as available funds.`, 'First priority', 'budget');
  if (academic < 85 || !degreeFit || Number(p.grade) < benchmark) add('Verify a shortlist of 3 programmes', 'Compare academic entry requirements, subject prerequisites, and qualification rules on the official course pages. Review any gaps with a counsellor.', 'This week', 'academic');
  const unfinished = DOCS.filter(([k]) => p[k] !== 'ready').map(([, label]) => label.toLowerCase());
  if (unfinished.length) add('Build your application checklist', `Start with ${unfinished.join(', ')}. Identify owners and preparation dates; bring documents only to a secure, authorised counselling process.`, 'Next 7 days', 'documents');
  if (p.english !== 'completed') add('Plan your language requirement', 'Check accepted tests, scores, exemptions, and result validity for your shortlist. Then schedule preparation and a suitable test date.', 'Next 2 weeks', 'documents');
  if (timeline < 80) add('Work backwards from your intake', `Confirm whether ${intakeLabel(p.intake)} is realistic. Map course deadlines, language results, funding, and application tasks on one calendar.`, 'This week', 'timeline');
  if (!actions.length) add('Validate your plan with a counsellor', 'Bring your shortlist, cost assumptions, funding route, and deadline calendar. Verify programme-specific details before applying.', 'Your next step', 'academic');
  add('Have a family Cost Clarity conversation', 'Walk through tuition, living costs, contingency, and reliable funding together. Record the questions you want to ask at the Action Desk.', 'Before committing', 'budget');
  return { complete: true, total, pathway, title: titles[pathway], description: descriptions[pathway], dimensions, estimate, coverage, gap: Math.max(0, Math.round((estimate.total - Number(p.funds)) * 10) / 10), eligibility, degreeFit, months, reasons, notes, actions };
}

export function demoProfiles(now = new Date()) {
  const intake = intakeOptions(now).find(v => (new Date(`${v}-01`) - now) / 86400000 >= 270) || intakeOptions(now).at(-1);
  const base = { name: 'Ananya Sharma', country: 'UK', level: 'masters', area: 'business', stage: 'final_year', intake, grade: '78', research: 'checked', fit: 'related', funds: '42', funding: 'confirmed', costs: 'all', work: 'no', transcripts: 'ready', statement: 'preparing', references: 'ready', cv: 'ready', passport: 'ready', english: 'booked', deadlines: 'mapped', nextsteps: 'dated' };
  return [
    { id: 'ready', label: 'The prepared planner', name: 'Ananya', hint: 'Strong foundation · UK', profile: base },
    { id: 'prepare', label: 'The early explorer', name: 'Kabir', hint: 'A few gaps to close · Ireland', profile: { ...base, name: 'Kabir Mehta', country: 'Ireland', area: 'technology', grade: '68', research: 'exploring', fit: 'transferable', funds: '29', funding: 'applied', costs: 'tuition_living', transcripts: 'ready', statement: 'identified', references: 'preparing', cv: 'preparing', passport: 'ready', english: 'planned', deadlines: 'identified', nextsteps: 'rough' } },
    { id: 'pause', label: 'The ambitious dreamer', name: 'Riya', hint: 'Funding needs a closer look · UK', profile: { ...base, name: 'Riya Kapoor', area: 'engineering', grade: '84', funds: '15', funding: 'exploring', costs: 'tuition', work: 'yes', research: 'shortlisted', statement: 'identified', english: 'planned', deadlines: 'identified', nextsteps: 'rough' } },
  ];
}

export const MYTHS = [
  { text: 'A high readiness score guarantees admission or a visa.', answer: false, explanation: 'FatehScore measures planning readiness. Universities and immigration authorities make their own decisions.' },
  { text: 'My study budget should include living costs and a contingency.', answer: true, explanation: 'Tuition is only one part of the picture. Plan for housing, day-to-day costs, other fees, and unexpected expenses.' },
  { text: 'I can rely on a part-time job to cover all my study costs.', answer: false, explanation: 'Jobs, hours, and earnings are uncertain and rules vary. Build a dependable funding plan before you travel.' },
  { text: 'Every course in the same country has identical entry requirements.', answer: false, explanation: 'Qualifications, subject prerequisites, tests, and deadlines can differ by programme and institution.' },
  { text: 'I should count an unawarded scholarship as confirmed funding.', answer: false, explanation: 'Treat scholarships as a possibility until the award and its conditions are confirmed.' },
  { text: 'I should work backwards from intake and application deadlines.', answer: true, explanation: 'Leave time for programme research, documents, language requirements, funding, and relevant application processes.' },
];
