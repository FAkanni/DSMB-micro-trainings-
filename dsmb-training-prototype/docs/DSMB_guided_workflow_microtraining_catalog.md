# DSMB Guided Workflow and Micro-Training Catalog

This catalog translates the CROMS DSMB module into potential guided walkthroughs and micro-trainings. It follows the pattern of the earlier ELRS guided UI prototype: each training is a short activity with a current screen, highlighted target, instruction text, required click/action, simulated or real state change, and a completion signal.

## Source Anchors

- Angular DSMB routes: `/src/NIA-CROMS-PORTAL/ClientApp/src/app/dsmb/dsmb-routing.module.ts`
- DSMB feature shell: `/src/NIA-CROMS-PORTAL/ClientApp/src/app/dsmb/`
- DSMB service/API calls: `/src/NIA-CROMS-PORTAL/ClientApp/src/app/dsmb/dsmb.service.ts`
- Shared route config: `/src/NIA-CROMS-PORTAL/ClientApp/src/app/shared/config/route-config.ts`
- DSMB backend functions: `/src/NIA-CROMS-API/DSMB/AfDSMB.cs`
- DSMB stored procedure wrapper: `/src/NIA-CROMS-DATA/DSMB/DSMBDBContext.cs`
- Shared workflow initiation endpoint: `/src/NIA-CROMS-API/AfShared.cs`
- Annual COI scheduler: `/src/NIA-CROMS-API/DSMB/AfAnnualCoiFormScheduler.cs`

## Training Pattern

Each guided activity can use a step model like:

```ts
interface DsmbWalkthroughStep {
  targetId: string;
  screen: string;
  title: string;
  body: string;
  expectedAction: string;
  successState?: string;
}
```

Example coach mark:

```ts
{
  targetId: 'dsmb-list-add-entity',
  screen: 'dsmb-list',
  title: 'Create a Safety Monitoring Oversight Entity',
  body: 'Start by adding the DSMB or ISM/SO record that will hold studies, members, meetings, documents, and COI activity.',
  expectedAction: 'Click Add',
  successState: 'Add Safety Monitoring Oversight Entity modal opens'
}
```

## Workflow Families

### 1. Oversight Entity Setup

This family teaches users how DSMB and ISM/SO records are created, found, and prepared for downstream activity.

#### Workflow 1.1: Find a DSMB or ISM/SO

Learner: general DSMB viewer, NIA staff, operations user  
Primary route: `/dsmb/dsmb-list` or `/dsmb/ismso-list`  
Source screens: `DSMBListComponent`, `DSMBDetailComponent`

Training goal: the learner can locate an oversight entity and open its details page.

Guided steps:

1. Highlight the Safety Monitoring Oversight area.
2. Highlight the DSMB list or ISM/SO list switch.
3. Highlight the filter/search area.
4. Highlight a result row.
5. Highlight the DSMB/ISM-SO name link.
6. Land on details and point out the collapsible panels: Meetings, Key Stakeholders/Members, Studies, Documents, COI, and Member Approval.

Completion signal: learner reaches the DSMB or ISM/SO Details page.

#### Workflow 1.2: Create a Safety Monitoring Oversight Entity

Learner: DSMB manager  
Primary route: `/dsmb/dsmb-list`  
Claims likely involved: `MNGDSMB`

Training goal: the learner can create a DSMB or ISM/SO shell and associate the first study context.

Guided steps:

1. Click Add on the list page.
2. Choose oversight entity type: DSMB or ISM/SO.
3. Enter entity name.
4. Search/select an associated study.
5. Save the entity.
6. Confirm that the new entity appears in the list.
7. Open the details page.

Completion signal: new entity details page opens with basic metadata populated.

Coach-mark targets:

- `dsmb-list-add-entity`
- `dsmb-entity-type`
- `dsmb-entity-name`
- `dsmb-associated-study-search`
- `dsmb-save-entity`
- `dsmb-open-created-entity`

#### Workflow 1.3: Build the Entity Profile

Learner: DSMB manager  
Primary route: `/dsmb/:dsmbId/dsmb-details` or `/dsmb/:dsmbId/ismso-details`

Training goal: the learner understands that the details page is a workspace made of panels.

Guided steps:

1. Highlight the metadata header.
2. Expand Meetings.
3. Expand Key Stakeholders/Members.
4. Expand Studies.
5. Expand Documents.
6. Expand COI if available.
7. Explain which panel to use for which job.

Completion signal: learner can identify the right panel for a future task.

### 2. Study Association

#### Workflow 2.1: Add a Study to a DSMB or ISM/SO

Learner: DSMB manager  
Primary route: DSMB/ISM-SO Details, Studies panel

Training goal: the learner can associate another study with an oversight entity.

Guided steps:

1. Open DSMB or ISM/SO Details.
2. Expand the Studies panel.
3. Click Add.
4. Search by study number/title.
5. Select the study.
6. Save.
7. Confirm the study appears in the Studies table.

Completion signal: the Studies count increments and the new study row is visible.

Coach-mark targets:

- `dsmb-studies-panel`
- `dsmb-studies-add`
- `dsmb-study-typeahead`
- `dsmb-study-select-result`
- `dsmb-study-save`

#### Workflow 2.2: Remove a Study Association

Learner: DSMB manager  
Primary route: DSMB/ISM-SO Details, Studies panel

Training goal: the learner can remove an incorrectly associated study and understand confirmation behavior.

Guided steps:

1. Expand Studies.
2. Highlight the row action menu or delete icon.
3. Click Delete/Remove.
4. Confirm the dialog.
5. Verify the study no longer appears.

Completion signal: removed study disappears from the table.

### 3. Member and Stakeholder Management

#### Workflow 3.1: Add a DSMB Member

Learner: DSMB manager  
Primary route: DSMB Details, Members panel  
Claims likely involved: `MNGDSMBMEM`

Training goal: the learner can add a regular DSMB member or chair.

Guided steps:

1. Expand Key Stakeholders/Members.
2. Click Add in the DSMB Members table.
3. Search/select the person.
4. Choose member role.
5. Save.
6. Confirm the member appears in the correct table.

Completion signal: new member row appears under DSMB Members.

Coach-mark targets:

- `dsmb-members-panel`
- `dsmb-members-add`
- `dsmb-member-person-search`
- `dsmb-member-role`
- `dsmb-member-save`

#### Workflow 3.2: Add an Ad Hoc Member for a Study

Learner: DSMB manager  
Primary route: DSMB Details, Members panel

Training goal: the learner can add an ad hoc DSMB or ISM/SO member and associate the member with a specific study.

Guided steps:

1. Expand Key Stakeholders/Members.
2. Click Add in the Ad Hoc Members table.
3. Search/select a person.
4. Choose ad hoc role.
5. Select the associated study.
6. Save.
7. Confirm the member appears under Ad Hoc Members.

Completion signal: member appears in the ad hoc table with the expected study association.

#### Workflow 3.3: Add NIA Staff or Study Team Member

Learner: DSMB manager  
Primary route: DSMB Details, Members panel

Training goal: the learner can distinguish DSMB members from operational stakeholders.

Guided steps:

1. Expand Key Stakeholders/Members.
2. Point out separate tables for DSMB/ISM-SO members, ad hoc members, study team members, and NIA staff.
3. Click Add in the appropriate operational stakeholder table.
4. Search/select the person.
5. Save.
6. Confirm the stakeholder appears in the intended table.

Completion signal: learner adds a non-member stakeholder without accidentally assigning voting/member role.

#### Workflow 3.4: Remove or Correct a Member

Learner: DSMB manager  
Primary route: DSMB Details, Members panel

Training goal: the learner can clean up a wrong member or role assignment.

Guided steps:

1. Locate the member row.
2. Open row actions.
3. Choose Edit or Delete.
4. Correct the role/study/person or confirm deletion.
5. Save/confirm.
6. Verify the updated table.

Completion signal: member table reflects the correction.

### 4. Meeting Lifecycle

The meeting lifecycle is one of the strongest candidates for guided walkthroughs because it has clear status transitions: Draft, Published, Pending Republish, In Progress, Ended/Completed, and Canceled.

#### Workflow 4.1: Create a Meeting

Learner: DSMB meeting manager  
Primary route: DSMB/ISM-SO Details, Meetings panel  
Claims likely involved: `MNGDSMBMTG`

Training goal: the learner can create the meeting shell.

Guided steps:

1. Expand Meetings.
2. Click Add Meeting.
3. Select meeting type.
4. Select meeting conduct: In Person, Virtual, or Written (Email) Review.
5. Enter start/end dates and times if applicable.
6. Add additional information.
7. Save.
8. Open the Meeting Details page.

Completion signal: meeting details page opens with status Draft.

Coach-mark targets:

- `dsmb-meetings-panel`
- `dsmb-meeting-add`
- `dsmb-meeting-type`
- `dsmb-meeting-conduct`
- `dsmb-meeting-start`
- `dsmb-meeting-end`
- `dsmb-meeting-save`

#### Workflow 4.2: Build a Meeting Agenda

Learner: DSMB meeting manager  
Primary route: Meeting Details, Agenda panel

Training goal: the learner can create a valid agenda before publishing.

Guided steps:

1. Open a Draft meeting.
2. Expand Agenda.
3. Click Add Agenda Item.
4. Choose agenda type: Study Specific, Open, Closed.
5. Select study if needed.
6. Enter session title/details.
7. Enter time/order fields.
8. Save.
9. Confirm the agenda item appears in sequence.

Completion signal: Agenda panel shows at least one valid item and validation blockers are cleared.

Coach-mark targets:

- `dsmb-agenda-panel`
- `dsmb-agenda-add`
- `dsmb-agenda-type`
- `dsmb-agenda-study`
- `dsmb-agenda-session`
- `dsmb-agenda-save`

#### Workflow 4.3: Upload Agenda Documents

Learner: DSMB meeting manager  
Primary route: Meeting Details, Agenda panel

Training goal: the learner can attach an agenda-level document to the right agenda item.

Guided steps:

1. Open Agenda.
2. Locate the agenda item row.
3. Click Add Document.
4. Choose document category.
5. Upload file.
6. Save/check in.
7. Verify document appears under the agenda item.

Completion signal: agenda item has a linked document.

#### Workflow 4.4: Manage Meeting Invitees

Learner: DSMB meeting manager  
Primary route: Meeting Details, Invitees panel  
Claims likely involved: `MNGMTGPART`

Training goal: the learner can add participants and understand invitee categories.

Guided steps:

1. Expand Invitees.
2. Review preloaded members/stakeholders.
3. Click Add Participant.
4. Search/select person.
5. Choose participant role/category.
6. Save.
7. Confirm invitee appears in the table.

Completion signal: invitee list includes the expected person and category.

#### Workflow 4.5: Draft and Publish Meeting Notifications

Learner: DSMB meeting manager  
Primary route: Meeting Details

Training goal: the learner can draft, review, and publish the meeting notification.

Guided steps:

1. Confirm meeting status is Draft or Pending Republish.
2. Click Draft Email.
3. Review To/Cc/Bcc recipients.
4. Review subject/body.
5. Save or update draft.
6. Preview email.
7. Click Publish.
8. Confirm meeting status changes to Published.

Completion signal: meeting status is Published and notification is sent/queued.

Coach-mark targets:

- `dsmb-meeting-draft-email`
- `dsmb-meeting-email-to`
- `dsmb-meeting-email-body`
- `dsmb-meeting-email-save-draft`
- `dsmb-meeting-email-preview`
- `dsmb-meeting-publish`

#### Workflow 4.6: Revise a Published Meeting

Learner: DSMB meeting manager  
Primary route: Meeting Details

Training goal: the learner understands how a Published meeting returns to an editable state.

Guided steps:

1. Open a Published meeting.
2. Click Revise.
3. Confirm status moves to Pending Republish.
4. Edit meeting info, agenda, invitees, or documents.
5. Draft updated email.
6. Publish revised meeting.

Completion signal: meeting is Published again after revision.

#### Workflow 4.7: Cancel a Meeting

Learner: DSMB meeting manager  
Primary route: Meeting Details

Training goal: the learner can cancel a Published meeting and send notification.

Guided steps:

1. Open a Published meeting.
2. Click Cancel.
3. Review cancellation email.
4. Send/confirm.
5. Verify meeting status changes to Canceled.

Completion signal: meeting status is Canceled.

#### Workflow 4.8: Start and End a Meeting

Learner: DSMB meeting manager  
Primary route: Meeting Details

Training goal: the learner can move a meeting through execution.

Guided steps:

1. Open a Published meeting.
2. Click Start.
3. Confirm status changes to In Progress.
4. Complete conduct/attendance fields.
5. Click End.
6. Confirm status changes to Ended or Completed.

Completion signal: meeting is no longer In Progress and required meeting conduct data is captured.

#### Workflow 4.9: Record Attendance During Meeting Conduct

Learner: DSMB meeting manager  
Primary route: Meeting Details, Conduct/Agenda panels

Training goal: the learner can capture attendance by agenda/session where applicable.

Guided steps:

1. Open an In Progress meeting.
2. Expand Conduct.
3. Open attendance capture.
4. Mark attendees present/absent.
5. Save attendance.
6. Confirm attendance status updates.

Completion signal: attendance data persists after refresh.

### 5. Document Management and Review

#### Workflow 5.1: Upload a DSMB-Level Document

Learner: DSMB document manager  
Primary route: DSMB Details, Documents panel

Training goal: the learner can upload a document to the DSMB record.

Guided steps:

1. Expand Documents.
2. Click Add Document.
3. Select category/tier/study/meeting fields as required.
4. Attach file.
5. Save/check in.
6. Verify document row appears with status/version.

Completion signal: document appears in Documents table.

Coach-mark targets:

- `dsmb-documents-panel`
- `dsmb-document-add`
- `dsmb-document-category`
- `dsmb-document-upload`
- `dsmb-document-save`

#### Workflow 5.2: Upload a Meeting-Level Document

Learner: DSMB meeting manager or document manager  
Primary route: Meeting Details, Documents panel

Training goal: the learner can attach documents to the correct meeting.

Guided steps:

1. Open Meeting Details.
2. Expand Documents.
3. Click Add Document.
4. Choose meeting document category.
5. Upload file.
6. Save/check in.
7. Confirm document appears under the meeting.

Completion signal: meeting document table shows new document.

#### Workflow 5.3: Check Out and Check In a Document

Learner: DSMB document manager

Training goal: the learner understands document version control.

Guided steps:

1. Locate a document row.
2. Click Check Out.
3. Confirm checked-out status.
4. Click Check In.
5. Attach replacement file or confirm current file.
6. Save.
7. Verify version/status update.

Completion signal: document returns to checked-in state with expected version.

#### Workflow 5.4: Discard a Check-Out

Learner: DSMB document manager

Training goal: the learner can abandon an accidental check-out.

Guided steps:

1. Locate checked-out document.
2. Click Discard Check Out.
3. Confirm dialog.
4. Verify document returns to previous state.

Completion signal: document is no longer checked out.

#### Workflow 5.5: Initiate Document Review Workflow

Learner: DSMB document manager or workflow initiator  
Primary route: DSMB Details or Meeting Details, Documents panel

Training goal: the learner can start document review and understand validation.

Guided steps:

1. Locate a ready document.
2. Click Initiate Review.
3. Show validation/precheck result.
4. Confirm workflow.
5. Observe review status: Initiating/Initiated/Processing.
6. Explain that Logic App workflow handles downstream review.

Completion signal: document review status changes from blank/draft to Initiated or Processing.

Coach-mark targets:

- `dsmb-document-review-action`
- `dsmb-document-workflow-precheck`
- `dsmb-document-workflow-confirm`
- `dsmb-document-review-status`

#### Workflow 5.6: Mark Final and Acknowledge a Document

Learner: DSMB member or required acknowledger

Training goal: the learner can recognize final documents and complete acknowledgement.

Guided steps:

1. Locate document with final/approved status.
2. Click Download/View.
3. Review document.
4. Click Acknowledge if prompted.
5. Confirm acknowledgement status.

Completion signal: acknowledgement recorded for user/document.

### 6. Conflict of Interest Workflow

#### Workflow 6.1: Report an Ad Hoc COI

Learner: DSMB manager or COI submitter  
Primary route: DSMB Details, COI panel  
Claims likely involved: `DSMBCOIPNL`, `SUBDSMBCOI`, `SUBMEMBCOI`

Training goal: the learner can create a new COI record and launch the appropriate workflow.

Guided steps:

1. Expand COI panel.
2. Click Report COI.
3. Select member/person and related context.
4. Validate workflow.
5. Create COI.
6. Navigate to COI Form.

Completion signal: COI form opens for the new COI.

Coach-mark targets:

- `dsmb-coi-panel`
- `dsmb-coi-report`
- `dsmb-coi-member-select`
- `dsmb-coi-create`
- `dsmb-coi-open-form`

#### Workflow 6.2: Complete and Submit a COI Form

Learner: DSMB member or COI submitter  
Primary route: COI Form

Training goal: the learner can answer dynamic COI questions and submit with e-signature.

Guided steps:

1. Open COI Form.
2. Review member/study/context header.
3. Complete required question panels.
4. Add explanatory text or supporting documents where required.
5. Save draft.
6. Click Submit.
7. Complete e-signature.
8. Confirm submission status.

Completion signal: COI review status is Submitted or under review.

Coach-mark targets:

- `coi-form-header`
- `coi-question-panel-first`
- `coi-save-response`
- `coi-submit-response`
- `coi-esignature-confirm`

#### Workflow 6.3: Annual COI Review

Learner: DSMB member, NIA COI administrator

Training goal: the learner understands annual COI initiation and completion.

Guided steps:

1. Explain annual COI trigger context.
2. Open assigned annual COI from task/link/dashboard.
3. Review preloaded prior COI answers where available.
4. Update responses.
5. Submit/e-sign.
6. Verify annual COI status.

Completion signal: annual COI submission is complete.

Implementation note: the scheduler queues annual COI workflows from backend automation, so a training demo may need simulated "task assigned" state.

#### Workflow 6.4: Review a COI Submission

Learner: DEA/reviewer/approver  
Primary route: COI Dashboard or COI Form review mode

Training goal: reviewer can evaluate a submitted COI and choose outcome.

Guided steps:

1. Open COI Dashboard.
2. Filter to My Tasks or relevant status.
3. Open COI record.
4. Review responses and documents.
5. Enter review comments.
6. Select outcome: approved/rejected/needs update depending on configured options.
7. Submit review.

Completion signal: COI review status changes and task leaves active queue.

#### Workflow 6.5: Build or Review a COI Package

Learner: COI package reviewer or DSMB manager  
Primary route: `/dsmb/coi-dashboard-package`

Training goal: the learner can open a package and understand package contents/versioning.

Guided steps:

1. Open COI Dashboard Package view.
2. Filter package rows.
3. Open package version.
4. Review included COIs.
5. Open individual COI if needed.
6. Review package document.
7. Submit/approve/request updates depending on role.

Completion signal: package status updates or reviewer exits with required review complete.

### 7. Member Approval Package Workflow

#### Workflow 7.1: Open Member Approval Dashboard

Learner: DSMB manager, member approval reviewer  
Primary route: `/dsmb/member-approval-dashboard`

Training goal: the learner can triage member approval packages.

Guided steps:

1. Open Member Approval Dashboard.
2. Toggle/filter My Task vs All.
3. Review package status and date/time columns.
4. Open package version.
5. Review package members and documents.

Completion signal: package details page opens.

#### Workflow 7.2: Review Member Eligibility

Learner: member approval reviewer  
Primary route: Member Approval Package

Training goal: reviewer can record eligibility outcome.

Guided steps:

1. Open assigned member package.
2. Review member profile and COI information.
3. Select eligibility outcome:
   - Eligible to serve as DSMB/ISM/SO Member
   - Eligible as consultant only
   - Not eligible due to conflict
4. Add comments if required.
5. Confirm director/reviewer acknowledgement.
6. Submit review.

Completion signal: package status advances and review outcome is recorded.

#### Workflow 7.3: Respond to Requested Updates

Learner: DSMB manager or package owner

Training goal: the learner can revise a package after updates are requested.

Guided steps:

1. Open package with Updates Requested status.
2. Review reviewer comments.
3. Edit member/package details.
4. Upload updated package document if required.
5. Submit updates.
6. Confirm status changes to Updates Submitted or Under Review.

Completion signal: updated package moves back into review.

### 8. ISM/SO Variants

#### Workflow 8.1: Switch Between DSMB and ISM/SO Work Modes

Learner: operations user with both DSMB and ISM/SO access

Training goal: learner understands shared screens with different context and labels.

Guided steps:

1. Open DSMB list.
2. Click View ISM/SO(s).
3. Compare columns and labels.
4. Open ISM/SO Details.
5. Point out where member roles, meeting conduct defaults, and workflow names differ.

Completion signal: learner can explain DSMB vs ISM/SO navigation.

#### Workflow 8.2: Create an ISM/SO Written Email Review Meeting

Learner: ISM/SO manager

Training goal: learner can create the common ISM/SO written review pattern.

Guided steps:

1. Open ISM/SO Details.
2. Add meeting.
3. Confirm conduct defaults to Written (Email) Review where applicable.
4. Select study agenda context.
5. Save.
6. Draft and publish email review notification.

Completion signal: written review meeting is Published.

### 9. Dashboard Triage

#### Workflow 9.1: COI Dashboard Triage

Learner: COI administrator/reviewer

Training goal: learner can use dashboard filters to identify work.

Guided steps:

1. Open COI Dashboard.
2. Switch between single COI and package mode if available.
3. Filter by status, person, DSMB/ISM-SO, or task mode.
4. Open a COI/package row.
5. Return to dashboard with filters preserved.

Completion signal: learner opens the correct record from a filtered queue.

#### Workflow 9.2: Member Approval Dashboard Triage

Learner: member approval reviewer

Training goal: learner can distinguish package statuses and act on assigned work.

Guided steps:

1. Open Member Approval Dashboard.
2. Review package status column.
3. Filter to assigned work.
4. Open package version.
5. Submit or defer action based on status.

Completion signal: learner reaches the right package and identifies required action.

### 10. Workflow Validation and Error Recovery

#### Workflow 10.1: Understand Workflow Precheck Failure

Learner: DSMB manager, workflow initiator

Training goal: learner can respond when a workflow cannot proceed.

Guided steps:

1. Attempt to initiate document or COI workflow.
2. Show validation/precheck dialog.
3. Read message explaining why workflow cannot proceed.
4. Navigate to missing prerequisite: agenda, document status, COI answer, reviewer, or package data.
5. Correct prerequisite.
6. Retry workflow.

Completion signal: retry passes validation or user knows what must be fixed.

#### Workflow 10.2: Recover from Dirty Form Navigation

Learner: any DSMB editor

Training goal: learner understands unsaved-change protection.

Guided steps:

1. Edit meeting, COI form, member package, or COI package.
2. Try to navigate away.
3. Show dirty-check dialog.
4. Choose stay and save, or discard intentionally.
5. Confirm final state.

Completion signal: learner exits without accidental data loss.

## Recommended Micro-Training Build Order

1. DSMB orientation and navigation
2. Create DSMB/ISM-SO entity
3. Add study
4. Add DSMB member
5. Create meeting
6. Build agenda
7. Publish meeting notification
8. Start/end meeting
9. Upload DSMB-level document
10. Initiate document review workflow
11. Report COI
12. Complete COI form with e-signature
13. Review COI from dashboard
14. Review member approval package
15. ISM/SO written email review variant

## Candidate Walkthrough Step Sets

### Step Set A: DSMB Setup Quickstart

```ts
[
  {
    targetId: 'safety-monitoring-nav',
    screen: 'home',
    title: 'Open Safety Monitoring Oversight',
    body: 'This area contains DSMB and ISM/SO setup, meetings, documents, and COI activity.',
    expectedAction: 'Click Safety Monitoring Oversight'
  },
  {
    targetId: 'dsmb-list-add-entity',
    screen: 'dsmb-list',
    title: 'Add the oversight entity',
    body: 'Create the DSMB or ISM/SO shell before adding studies, members, meetings, or documents.',
    expectedAction: 'Click Add'
  },
  {
    targetId: 'dsmb-entity-type',
    screen: 'entity-modal',
    title: 'Choose DSMB or ISM/SO',
    body: 'The type controls labels, role lists, and some downstream workflow names.',
    expectedAction: 'Select DSMB'
  },
  {
    targetId: 'dsmb-associated-study-search',
    screen: 'entity-modal',
    title: 'Associate the first study',
    body: 'Search for the study that this oversight entity will monitor.',
    expectedAction: 'Select a study'
  },
  {
    targetId: 'dsmb-save-entity',
    screen: 'entity-modal',
    title: 'Save the entity',
    body: 'After saving, the entity can be opened and expanded into a full workspace.',
    expectedAction: 'Click Save'
  }
]
```

### Step Set B: Meeting Publication

```ts
[
  {
    targetId: 'dsmb-meetings-panel',
    screen: 'dsmb-details',
    title: 'Open Meetings',
    body: 'Meetings are managed from the DSMB or ISM/SO details page.',
    expectedAction: 'Expand Meetings'
  },
  {
    targetId: 'dsmb-meeting-add',
    screen: 'dsmb-details',
    title: 'Create a meeting',
    body: 'Start with the meeting shell, then add agenda items, invitees, documents, and notifications.',
    expectedAction: 'Click Add Meeting'
  },
  {
    targetId: 'dsmb-meeting-conduct',
    screen: 'meeting-modal',
    title: 'Select conduct mode',
    body: 'Conduct mode changes which fields and agenda behaviors are available.',
    expectedAction: 'Choose Virtual, In Person, or Written Email Review'
  },
  {
    targetId: 'dsmb-agenda-add',
    screen: 'meeting-details',
    title: 'Add agenda item',
    body: 'A meeting must have valid agenda content before notification can be published.',
    expectedAction: 'Click Add Agenda Item'
  },
  {
    targetId: 'dsmb-meeting-draft-email',
    screen: 'meeting-details',
    title: 'Draft notification',
    body: 'Review recipients and message content before publishing the meeting.',
    expectedAction: 'Click Draft Email'
  },
  {
    targetId: 'dsmb-meeting-publish',
    screen: 'email-modal',
    title: 'Publish meeting',
    body: 'Publishing sends or queues the notification and moves the meeting out of Draft.',
    expectedAction: 'Click Publish'
  }
]
```

### Step Set C: Document Review

```ts
[
  {
    targetId: 'dsmb-documents-panel',
    screen: 'dsmb-details',
    title: 'Open Documents',
    body: 'Documents can live at the DSMB level, meeting level, agenda level, or package level.',
    expectedAction: 'Expand Documents'
  },
  {
    targetId: 'dsmb-document-add',
    screen: 'documents-panel',
    title: 'Add document',
    body: 'Upload the file and choose the right category before review can begin.',
    expectedAction: 'Click Add Document'
  },
  {
    targetId: 'dsmb-document-upload',
    screen: 'document-modal',
    title: 'Attach file',
    body: 'The document upload also feeds check-in/version behavior.',
    expectedAction: 'Attach a file'
  },
  {
    targetId: 'dsmb-document-review-action',
    screen: 'documents-panel',
    title: 'Initiate review',
    body: 'The system validates workflow readiness before calling the Logic App workflow.',
    expectedAction: 'Click Initiate Review'
  },
  {
    targetId: 'dsmb-document-workflow-confirm',
    screen: 'workflow-confirmation',
    title: 'Confirm workflow',
    body: 'After confirmation, review status should move to Initiated or Processing.',
    expectedAction: 'Click Confirm'
  }
]
```

### Step Set D: COI Submission

```ts
[
  {
    targetId: 'dsmb-coi-panel',
    screen: 'dsmb-details',
    title: 'Open COI',
    body: 'COI records are tied to DSMB/ISM-SO members and review workflows.',
    expectedAction: 'Expand COI'
  },
  {
    targetId: 'dsmb-coi-report',
    screen: 'coi-panel',
    title: 'Report COI',
    body: 'Use this path for an ad hoc COI or member-specific conflict event.',
    expectedAction: 'Click Report COI'
  },
  {
    targetId: 'coi-form-header',
    screen: 'coi-form',
    title: 'Review COI context',
    body: 'Confirm the member, oversight entity, and study context before answering questions.',
    expectedAction: 'Review header'
  },
  {
    targetId: 'coi-question-panel-first',
    screen: 'coi-form',
    title: 'Complete required questions',
    body: 'Question panels may reveal follow-up fields based on responses.',
    expectedAction: 'Answer required questions'
  },
  {
    targetId: 'coi-submit-response',
    screen: 'coi-form',
    title: 'Submit COI',
    body: 'Submitting launches the review path after validation and e-signature.',
    expectedAction: 'Click Submit'
  },
  {
    targetId: 'coi-esignature-confirm',
    screen: 'esignature',
    title: 'Complete e-signature',
    body: 'The submission is not complete until the signature step succeeds.',
    expectedAction: 'Confirm signature'
  }
]
```

### Step Set E: Member Approval Review

```ts
[
  {
    targetId: 'member-approval-dashboard-link',
    screen: 'dsmb-details',
    title: 'Open Member Approval',
    body: 'Member approval packages track eligibility decisions for DSMB/ISM/SO participation.',
    expectedAction: 'Open Member Approval Dashboard'
  },
  {
    targetId: 'member-package-row',
    screen: 'member-approval-dashboard',
    title: 'Open assigned package',
    body: 'Use status and package version to choose the right package.',
    expectedAction: 'Click package version'
  },
  {
    targetId: 'member-review-outcome',
    screen: 'member-package',
    title: 'Select eligibility outcome',
    body: 'Choose whether the person is eligible as a member, consultant only, or not eligible.',
    expectedAction: 'Select outcome'
  },
  {
    targetId: 'member-review-comments',
    screen: 'member-package',
    title: 'Add review comments',
    body: 'Comments are required for some non-eligible or consultant-only outcomes.',
    expectedAction: 'Enter comments'
  },
  {
    targetId: 'member-review-submit',
    screen: 'member-package',
    title: 'Submit review',
    body: 'Submitting records the reviewer decision and advances the package.',
    expectedAction: 'Click Submit'
  }
]
```

## Micro-Training Design Notes

- Keep each micro-training between 5 and 9 steps. DSMB workflows are dense, so shorter guided activities will be easier to complete.
- Build separate DSMB and ISM/SO variants only where labels, defaults, or workflow names differ.
- Use simulated data for early prototypes. The real app depends on claims, SQL stored procedures, document storage, and Logic Apps, so a demo route can teach the behavior without requiring live backend orchestration.
- For integrated training later, attach `data-tour-target` attributes to real buttons/tables/modals and use the same overlay mechanism from the ELRS prototype.
- Good completion signals are visible state changes: row added, panel count changes, status changes from Draft to Published, review status changes to Initiated, or acknowledgement recorded.
- Workflow validation failures should be treated as teachable moments, not dead ends. A guided demo can intentionally trigger one failure, explain the missing prerequisite, fix it, then retry.

## High-Value Prototype Candidates

The first prototype should probably be "Meeting Publication" because it touches the most recognizable DSMB lifecycle concepts without needing COI/e-signature complexity. The second should be "COI Submission" because it captures a high-stakes, role-specific workflow. The third should be "Document Review" because it maps cleanly to backend workflow validation and Logic App initiation.

