# FutureScan · Fateh Education

A working, browser-only prototype of the **Fateh Study Abroad Reality Check** in the supplied case competition deck. Enter a student’s study plans, academic background, funding, document status, and timeline to generate a FatehScore and a personalised “My Study Abroad Next Steps” roadmap.

## Download and run — no installation needed

**[Download the ready-to-use demo ZIP](https://github.com/Aarryan69/prototype-fatehedu-/raw/refs/heads/main/demo/FutureScan-demo-kit.zip)**

1. Download the ZIP above and extract / unzip it on your laptop.
2. Open **`FutureScan.html`** in Google Chrome, Microsoft Edge, Firefox, or Safari.
3. Choose **Try a demo profile**, or fill out the blank form yourself.
4. Select **See my scorecard** to reveal the result. **Save scorecard** opens the print / PDF dialog.

The demo works offline. GitHub displays HTML as source code; download the file and open it in a browser to use the interactive form.

- [Browse the standalone HTML](demo/FutureScan.html)
- [Read the judging demo guide](demo/START-HERE.txt)
- [View a sample scorecard PDF](demo/FutureScan-sample-scorecard.pdf)
- [See the scorecard preview](demo/FutureScan-scorecard-preview.png)

To download every source file as well, use GitHub’s green **Code → Download ZIP** button. The `src/` folder contains the application and scoring model, `tests/` contains the checks, and `demo/` contains the ready-to-open demonstration files.

## Use it in front of the judges

Open **`demo/FutureScan.html`**, or **`dist/index.html`** after building the source, in Chrome, Edge, Firefox, or Safari. The production build is a single file with the application, styles, icons, and fonts included. It needs no server, internet connection, account, API key, or installation. After downloading, open the file in a browser; some document previewers do not execute interactive HTML.

1. Start with the blank form and enter fictional details, or choose **Try a demo profile** in the header.
2. Walk through the five sections. All sample answers remain editable. **See my scorecard** provides a shortcut once the profile is complete.
3. Optionally answer the six myth-busters. They teach the intended distinctions without affecting the score.
4. Reveal the scorecard: overall score, readiness pathway, four weighted dimensions, a first-year funding picture, and personalised next steps.
5. Use **Explore a what-if** to change available funding, then apply it to recalculate. The funding source and part-time-work assumptions still matter.
6. Choose a next step at the **Action Desk** to add a counselling, parent session, or event preference to the roadmap. This is a local preference; no booking or message is sent.
7. Select **Save scorecard** and choose **Save as PDF** in the browser print dialog. A4 paper, default scale, and disabled browser headers/footers work well.

Answers are held in tab memory only. Reloading clears them. Use the print/PDF option to keep a result. Start-over asks before discarding the current profile.

### A 90-second demonstration

- Load **Ananya · The prepared planner**. Show the study destination, academic research, and arranged funding. Her illustrative result is **97/100 · Ready to plan**.
- Open **Riya · The ambitious dreamer**. Her strong academics do not remove a funding gap: **64/100 · Pause & verify affordability**.
- Increase Riya’s funding in the what-if control. Her score improves, but the affordability flag remains because she still relies on part-time earnings. Edit **Budget & funding**, select **No** for work reliance, and confirm other assumptions to demonstrate a meaningful change.
- Finish on the personalised roadmap and save a printable scorecard.

**Kabir · The early explorer** demonstrates **69/100 · Needs preparation**.

The demo intakes move forward with the calendar so the examples remain usable. Exact timeline scores can change as a manually selected intake approaches.

## Deck fidelity and explicit assumptions

The relevant framework is on PDF page 4, labelled **03/06**. It defines:

| Dimension | Deck weight |
| --- | ---: |
| Academic fit | 30% |
| Budget preparedness | 30% |
| Documentation readiness | 20% |
| Timeline readiness | 20% |

The deck also specifies three pathways, a one-page roadmap, 5–7 myth-buster scenarios, an Action Desk, and “insufficient information” when required information is missing. The appendix identifies the framework itself as a planning assumption subject to Fateh validation.

**The deck does not define numerical sub-scores, thresholds, real programme fees, or eligibility rules.** These are invented, transparent demonstration assumptions in `src/scoring.js`, explained in the application’s **How it works** dialog. Nothing here predicts admission, scholarships, employment, or visas.

### Prototype calculation

Each dimension is normalised to 100. The weighted contributions are rounded to one decimal and the final sum to the nearest integer.

- **Academic:** 40 points for a sample percentage benchmark, 35 for programme research, 25 for subject fit. A 0.65 multiplier applies when a master’s candidate is neither in final year nor graduated. Sample grade benchmarks are 60% for business/creative and 65% for technology/engineering. This does not establish actual eligibility.
- **Budget:** 60 points for the share of sample first-year cost covered by stated funding, capped at 100% coverage; 20 for cost awareness; 20 for funding certainty.
- **Documents:** 15 points for each of transcripts, statement of purpose, references, CV, and passport readiness; 25 for language preparation. Statuses receive partial credit. No documents are collected.
- **Timeline:** 40/32/20/8/0 points for 9+/6+/3+/positive/zero months to intake; up to 30 each for deadline mapping and dated actions.
- **Ready to plan:** at least 75 overall, all dimensions at least 60, sample grade and qualification checks aligned, and an intake in the future.
- **Pause & verify affordability:** overrides the numeric score when funding covers less than 70% of the sample first-year cost, no funding source is identified, or part-time work is needed/uncertain.
- **Needs preparation:** complete profiles that meet neither rule above.
- **Insufficient information:** missing or invalid required answers produce no numeric score.

All cost estimates are fictional first-year amounts in INR lakh, with a 10% contingency. Bachelor’s degree costs do not cover the remaining years. Funding is self-reported and never independently verified. Real programmes, costs, qualifications, language requirements, and deadlines must be checked separately.

## Development

Requires Node.js 20.19+ or 22.12+ (tested with Node 24.19.0) and npm.

```bash
git clone https://github.com/Aarryan69/prototype-fatehedu-.git
cd prototype-fatehedu-
npm ci
npm run dev
```

In the prepared cloud environment, use the existing checkout at `/workspace/prototype-fatehedu-` instead of cloning again. Each cloud task is already isolated; a Git worktree is unnecessary unless explicitly requested. Use `/workspace/.npm-cache` for npm’s cache when needed in that environment.

Vite listens on port 5173 and fails if the port is occupied. No backend or credentials are required.

```bash
npm test           # 18 meaningful scoring and boundary tests
npm run build     # Generates a standalone dist/index.html
npm run test:ui   # Requires the dev server and system Chromium
```

`CHROMIUM_PATH` can override `/usr/bin/chromium`. `TEST_URL` can override the default local test URL. Browser checks cover manual entry, validation, incomplete submissions, all pathways, myth-busters, Action Desk preferences, what-if recalculation, reset, mobile overflow, and an offline single-file build. Screenshots and the sample PDF go into ignored `artifacts/`.

## Files

- `src/App.jsx`: guided form, scorecard, myth-busters, methodology, Action Desk.
- `src/scoring.js`: sample programmes, weights, validation, scoring, pathways, roadmap, and demo profiles.
- `src/styles.css`: responsive interface and A4 print layout.
- `tests/scoring.test.js`: scoring and boundary tests.
- `tests/browser.mjs`: browser workflow and offline checks.
- `demo/FutureScan.html`: the complete, ready-to-open offline application.
- `demo/FutureScan-demo-kit.zip`: the application, judging guide, and sample scorecard in one download.
- `demo/FutureScan-sample-scorecard.pdf`: an example printable result.
- `demo/FutureScan-scorecard-preview.png`: a visual preview of the result screen.
- `docs/screenshots/`: desktop and mobile screenshots of the form and scorecard.

The committed files in `demo/` are the tested judging build. After making application changes, run `npm run build` to create an updated `dist/index.html`, then refresh the demo copy and ZIP if distributing a new version.

This is a working demonstration, not a deployed service. It deliberately uses no live university database, payment flow, CRM, or booking system.
