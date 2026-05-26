# DSMB Guided Training Conversation Context

Generated: May 5, 2026

This file packages the working conversation context for the DSMB guided training prototype. It is a reconstructed conversation record from the active Codex thread, not a native platform export.

## Project Goal

Build standalone guided micro-trainings for the CROMS DSMB module so reviewers can test the workflow design before the trainings are wired into the larger CROMS application.

## Main Decisions

- Focus specifically on the DSMB module in the CROMS source code.
- Develop potential DSMB and ISM/SO workflow maps and micro-trainings based on prior work referenced by the user as `019dda97-a992-7841-836c-d114b4a19a36`.
- Build the trainings separately from the larger CROMS program for now.
- Preserve transferability to the real CROMS UI by using stable guided target IDs.
- Make the standalone trainer visually match CROMS much more closely.
- Use rendered, clickable CROMS-like screens rather than flat image backgrounds so the guided actions stay interactive and can map later to real UI controls.
- Improve fidelity for control types: text entry should require typed input, dropdowns should open with visible options, typeahead controls should show selectable results, radio choices should behave like choices, and comment boxes should accept text.
- Package the prototype as zip files so reviewers can open `index.html` locally.

## User Requests And Responses

### Initial DSMB Focus

User asked:

> Take a look at the CROMS_SOURCE source code I want you to really focus on the DSMB module specifically

Response/action:

- Reviewed the DSMB-related CROMS source structure.
- Identified DSMB, ISM/SO, meetings, documents, COI, member approval, and workflow-related surfaces as candidate training areas.

### Workflow And Micro-Training Development

User asked:

> develop a bunch of potential workflows that we could map for this DSMB module and develop potential micro-trainings where one is guided to do things.

Response/action:

- Created the planning artifact:
  - `DSMB_guided_workflow_microtraining_catalog.md`
- Developed a catalog of DSMB and ISM/SO workflow candidates and micro-training concepts.

### Build The Trainings

User said:

> great, let's build these

User clarified:

> I'm not worried about wiring this into the larger program, I want to build these trainings separately for now and then will write them in later. Thoughts?

User approved:

> go for it

Response/action:

- Built a standalone static prototype in:
  - `dsmb-training-prototype/`
- Created:
  - `index.html`
  - `styles.css`
  - `app.js`
  - `data/trainings.js`
  - `README.md`
- Added 17 guided trainings and 90 guided target IDs.
- Verified that JavaScript syntax checks passed and all guided targets were handled.

### Use It

User said:

> Alright I want to use it

Response/action:

- Opened the standalone prototype locally.
- Confirmed that it could run as a static page and through a simple local server.

### CROMS UI Fidelity

User said:

> This doesn't look like the CROMS user interface, make sure it matches this nearly exactly. I need to ensure that people understand the transferability, maybe a visual reference of the UI with the buttons placed on top?

Response/action:

- Inspected actual CROMS UI styles and assets from the source code.
- Copied real CROMS font and tile assets into the standalone prototype:
  - Source Sans Pro font files
  - CROMS dashboard tile images
- Updated the rendered training stage to include CROMS-like:
  - NIA/CROMS header
  - Breadcrumb bar
  - DSMB dashboard tile layout
  - Page headers
  - List tables
  - Buttons
  - Collapsible panels
  - Modals
  - Status pills
- Chose interactive rendered screens instead of flat image references so buttons and controls stay targetable.

### Control-Level Fidelity

User said:

> Some of the user experience is missing some fidelity, if it's a free text I need the person to simulate entering free text or if it is a drop down I need it to show the drop down, the options and for them to select the correct one.

Response/action:

- Added a richer interaction layer for guided steps.
- Added support for:
  - Typed free text fields
  - Textareas
  - Dropdown menus with visible options
  - Typeahead/lookup result lists
  - Radio choices
  - Selected states
  - Comment entry fields
- Updated coachmark prompts so they say things like:
  - Type the expected text
  - Select the correct dropdown option
  - Enter free text
- Verified:
  - 17 trainings
  - 90 targets
  - 0 unhandled targets
  - JavaScript syntax checks pass

### Sharing The Prototype

User asked:

> How can I share this with other people if it is not on a website

Response/action:

- Explained that it can be shared as a static site or as a zip file.
- Recommended a zip for immediate review and private/internal static hosting for broader testing.

### Create Zip Files

User asked:

> create the zip files and provide the instructions for someone to open index.html on their computer

Response/action:

- Added reviewer instructions:
  - `dsmb-training-prototype/OPEN_ME_FIRST.txt`
- Created:
  - `DSMB-guided-training-prototype-share.zip`
  - `DSMB-guided-training-review-bundle.zip`
- Verified zip integrity with `unzip -t`.

## Current Prototype Package Contents

The primary standalone prototype folder is:

`dsmb-training-prototype/`

Important files:

- `index.html` - open this file to run the trainer
- `OPEN_ME_FIRST.txt` - reviewer instructions
- `README.md` - project notes
- `app.js` - training engine and simulated UI renderer
- `styles.css` - CROMS-like styling and guided overlay styles
- `data/trainings.js` - micro-training definitions
- `assets/` - local CROMS fonts and dashboard tile images

## Current Training Modules

- Find a DSMB or ISM/SO
- Create Safety Monitoring Entity
- Add a Study Association
- Add a DSMB Member
- Add an Ad Hoc Member
- Create a Meeting
- Build a Meeting Agenda
- Publish Meeting Notification
- Start and End a Meeting
- Upload DSMB Document
- Initiate Document Review
- Workflow Validation Recovery
- Report an Ad Hoc COI
- Complete and Submit COI Form
- Review a COI Submission
- Review Member Approval Package
- ISM/SO Written Email Review

## Reviewer Opening Instructions

1. Download the zip file.
2. Unzip or extract it first.
3. Open the extracted `dsmb-training-prototype` folder.
4. Double-click `index.html`.
5. Open with Chrome, Edge, Safari, or Firefox if prompted.

Important:

- Do not open `index.html` from inside the compressed zip preview.
- Keep `index.html`, `app.js`, `styles.css`, `data/`, and `assets/` together.
- The prototype does not require CROMS login.
- The prototype does not require internet access.

## If Local File Opening Is Blocked

Mac:

```bash
cd "PATH_TO_THE_EXTRACTED/dsmb-training-prototype"
python3 -m http.server 8080
```

Then open:

```text
http://127.0.0.1:8080/
```

Windows, if Python is installed:

```powershell
cd "PATH_TO_THE_EXTRACTED\dsmb-training-prototype"
py -m http.server 8080
```

Then open:

```text
http://127.0.0.1:8080/
```

## Validation Notes

Latest validation performed during the conversation:

- `node --check dsmb-training-prototype/app.js`
- `node --check dsmb-training-prototype/data/trainings.js`
- Training data integrity check:
  - 17 trainings
  - 90 guided targets
  - 0 unhandled targets

## Remaining Useful Next Steps

- Have reviewers run through each training and flag wording or control mismatch issues.
- Decide whether any reviewer-facing package should use the prototype-only zip or the larger review bundle.
- When ready, map each prototype `targetId` to real CROMS Angular elements through `data-tour-target` attributes or an equivalent tour targeting pattern.

