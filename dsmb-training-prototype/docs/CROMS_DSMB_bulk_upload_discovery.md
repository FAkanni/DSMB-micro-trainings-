# CROMS DSMB bulk upload discovery

Date reviewed: 2026-05-06

Source meeting summary:
`[not included in transfer package: DSMB bulk upload meeting summary document]`

Source code root:
`[not included in transfer package: NIACROMS_SOURCE/NIA-CROMS-PLATFORM]`

## Meeting asks

- Migrate DSMB-related documents and metadata from SharePoint into CROMS for roughly 160-200 DSMBs.
- Needed hierarchy: DSMB -> Study -> Board Members -> Meeting -> Agenda -> Documents.
- Documents can live at DSMB, meeting, or agenda level.
- Historical documents should be marked final and should not trigger normal approval workflows.
- Open/closed session visibility must be preserved, especially for unblinded or closed-session material.
- SAEs and historical CVs are special cases.
- The next useful artifact is a JSON or Excel mapping template with required and optional fields.

## Main code locations

- Azure Function API: `src/NIA-CROMS-API/DSMB/AfDSMB.cs`
- DSMB stored procedure wrapper: `src/NIA-CROMS-DATA/DSMB/DSMBDBContext.cs`
- C# DTOs: `src/NIA-CROMS-MODELS/DTO/DsmbDto.cs`, `src/NIA-CROMS-MODELS/DTO/DsmbMeetingDto.cs`
- Angular DTOs: `src/NIA-CROMS-PORTAL/ClientApp/src/app/model/dsmb/dsmb.ts`
- Angular DSMB route constants: `src/NIA-CROMS-PORTAL/ClientApp/src/app/shared/config/route-config.ts`
- Angular DSMB constants: `src/NIA-CROMS-PORTAL/ClientApp/src/app/shared/identifiers/dsmb-identifiers.ts`
- Shared document uploader: `src/NIA-CROMS-PORTAL/ClientApp/src/app/shared/components/document-upload/document-upload.component.ts`

## API and stored procedure map

| Purpose | HTTP route | Function | Stored procedure or backend call |
| --- | --- | --- | --- |
| List DSMB or ISM/SO records | `GET dsmbIsmlist/{oversightContext}` | `AF_GET_DSMBLIST` | `NIA.AP_DSMB_LISTING_DS_PRO` |
| Get DSMB detail graph | `GET dsmb/{dsmbId}` | `AF_GET_DSMBDATA` | `NIA.AP_GET_DSMB_DETAILS_DS_PRO` |
| Save DSMB, studies, members, DSMB-level docs | `POST dsmb/save/{sectionName?}` | `AF_CREATE_DSMB` | `NIA.AP_SAVE_DSMB_DATA_DS_PRO` |
| Get meeting detail graph | `GET dsmbmeeting/{meetingId}` | `AF_GET_DSMB_MEETINGDATA` | `NIA.AP_GET_DSMB_MEETING_DETAILS_DS_PRO` |
| Save meeting, agendas, meeting docs, agenda docs | `POST dsmbmeeting/save/{dsmbId}/{sectionName?}` | `AF_CREATE_DSMB_MEETING` | `NIA.AP_SAVE_DSMB_MEETING_DS_PRO` |
| Mark document status/final | `POST dsmb/document/status` | `AF_SAVE_DSMB_DOCUMENT_STATUS` | `NIA.AP_SAVE_DSMB_DOCUMENT_STATUS_DS_PRO` |
| Download file from blob | `POST download/blobfile` | `AF_DOWNLOAD_BLOBFILE` | `Shared.GetBlobContentAsByteArray` |
| Get LOV values | `GET listOfValues?searchCriteria=...` | `AF_GET_LIST_OF_VALUES` | `NIA.AP_GET_LOV_DS_PRO` |
| Search people | `GET searchpersons?searchCriteria=DSMB_PERSON&searchText=...` | `AF_SEARCH_PERSONS` | `NIA.AP_GETPERSONS_DS_PRO` |
| Get DSMB field configuration | `GET DSMBfieldconfig/{panelMode}` | `AF_GETDSMB_PANEL_FIELD_CONFIGURATION` | `NIA.AP_GET_STUDY_PANEL_FIELD_CONFIGURATION` |

Important route/config references:

- `src/NIA-CROMS-API/DSMB/AfDSMB.cs:55` for DSMB list.
- `src/NIA-CROMS-API/DSMB/AfDSMB.cs:106` for DSMB save.
- `src/NIA-CROMS-API/DSMB/AfDSMB.cs:170` for DSMB detail.
- `src/NIA-CROMS-API/DSMB/AfDSMB.cs:217` for meeting detail.
- `src/NIA-CROMS-API/DSMB/AfDSMB.cs:274` for meeting save.
- `src/NIA-CROMS-DATA/DSMB/DSMBDBContext.cs:17` through `src/NIA-CROMS-DATA/DSMB/DSMBDBContext.cs:132` for stored procedure names.
- `src/NIA-CROMS-PORTAL/ClientApp/src/app/shared/config/route-config.ts:190` for Angular route constants.

## Section names seen in the UI/API

Backend constants:

- `DSMB_DOCUMENT`
- `ISMSO_WORKFLOW_DOCUMENT`
- `DSMB_MEETING_DOCUMENT`
- `DSMB_MEETING_AGENDA_DOCUMENT`

Frontend save contexts also used:

- `DSMB_STUDY`
- `DSMB_MEMBER`
- `MEETING_UPDATE`
- `MEETING_AGENDA`
- `MEETING_AGENDA_IN_PROGRESS`
- `SAVE_AGENDA_ATTENDANCE`
- `DSMB_DELETE_MEETING`

The stored procedures are not included in the source tree, so the authoritative accepted section list should be confirmed from `NIA.AP_SAVE_DSMB_DATA_DS_PRO` and `NIA.AP_SAVE_DSMB_MEETING_DS_PRO`.

## Data mapping by entity

### DSMB

Primary DTO fields:

- `DsmbId`
- `DsmbName`
- `OversightEntityType`
- `DsmbChairName`
- `Studies`
- `Members`
- `Meetings`
- `Documents`
- `DsmbDocument`
- `DsmbMember`

UI-required fields for create/edit:

- `oversightEntityType`
- `dsmbName`
- at least one study

Lookups:

- `DSMB_ISMSO_OVERSIGHT_ENTITY_TYPE`
- `DSMB_LIST` or `ISMSO_LIST` for DSMB/ISM-SO name typeahead

Save route:

- `POST dsmb/save/{sectionName?}`
- For normal DSMB create/update, the UI posts the whole `DsmbData` object without a section name.

### Study association

Fields:

- `Id`
- `StudyId`
- `StudyNumber`
- `StudyTitle`
- `GrantNumber`
- `StudyStatus`
- `Action`

Lookups:

- `DSMB_STUDIES`
- `ISMSO_STUDIES`

Important behavior:

- Study search passes the current DSMB id as extra criteria so the API can flag whether a study is already associated with another DSMB.
- Save uses `POST dsmb/save/DSMB_STUDY` from the detail screen, or bundled studies in the top-level DSMB create payload.

### Board/member association

Fields:

- `Id`
- `DsmbPerId`
- `DsmbMemberName`
- `DsmbMemberRole`
- `DsmbMemberRoleCode`
- `DsmbMemberStatus`
- `MemberStudies`
- `Action`

Lookups/search:

- `DSMB_PERSON` through `searchpersons`
- `DSMB_LEVEL_MEMBER_ROLES`
- `ISMSO_LEVEL_MEMBER_ROLES`

UI-required fields:

- Person
- Role
- For ad hoc DSMB members, at least one associated study

Save route:

- `POST dsmb/save/DSMB_MEMBER`

### Meeting

Fields:

- `MeetingId`
- `DsmbId`
- `MeetingStartTime`
- `MeetingEndTime`
- `AdhocMeeting`
- `MeetingType`
- `ConductCode`
- `AdditionalInformation`
- `AgendaStudyId` for written email review when applicable

Lookups:

- `DSMB_MEETING_CONDUCT_MODE`
- `DSMB_MEETING_TYPES`

UI-required fields:

- Meeting start date/time
- Meeting end date/time
- Conduct mode
- In person/virtual details only when conduct mode is `In Person` or `Virtual`

Validation:

- Start must be before end.
- Meeting type is optional in the UI.

Save route:

- Create: `POST dsmbmeeting/save/{dsmbId}`
- Update: `POST dsmbmeeting/save/{dsmbId}/MEETING_UPDATE`

### Agenda

Fields:

- `AgendaId`
- `AgendaType`
- `AgendaTitle`
- `AgendaMeetingStartTime`
- `StudyId`
- `StudyNumber`
- `StudyTitle`
- `SessionType`
- `DiscussionType`
- `Description`
- `Action`

Lookups:

- `DSMB_AGENDA_TYPE`
- `DSMB_SESSION_TYPE`
- `DSMB_DISCUSSION_TYPE`

UI-required fields:

- Agenda type
- Agenda title
- Agenda start date/time
- If agenda type is `Study Specific`: study, session type, and discussion type

Validation:

- Agenda start must be within meeting start/end.
- Agenda start time must be unique within the meeting.
- If a closed agenda already has an unblinded document, the UI prevents changing the session type.

Save route:

- `POST dsmbmeeting/save/{dsmbId}/MEETING_AGENDA`

### Document

Fields:

- `Id`
- `StudyId`
- `MeetingId`
- `AgendaId`
- `IncludeUnblindedDataFlag`
- `DocumentCategory`
- `DocumentCategoryType`
- `DocumentCategoryCode`
- `DocumentStatus`
- `VersionNo`
- `VersionDate`
- `CheckInCheckOutStatus`
- `IsMarkDocumentStatustoFinal`
- `Attachment`

Attachment fields:

- `FileName`
- `SystemFileName`
- `URLLocation`
- `ByteArrayContent`
- `Type`
- `FileExtention`
- `VersionId`

Lookups:

- `DSMB_DOCUMENT_CATEGORY`
- `DSMB_DOCUMENT_STATUS`
- `DSMB_DOC_WORKFLOW_CATEGORIES` only matters if using approval workflow.

UI-required fields:

- File
- Document category
- Document status
- Meeting is required when `IncludeUnblindedDataFlag` is true.
- Agenda is required when the agenda selector is visible.
- Unblinded documents must be attached to a closed agenda/session.

Blob behavior:

- Container: `dsmb-document`.
- If `Attachment.SystemFileName` is missing, the API sets it to `Guid.NewGuid() + FileExtention`.
- API uploads `Attachment.ByteArrayContent` to blob storage.
- API writes back `Attachment.URLLocation` and `Attachment.VersionId`.
- API clears `Attachment.ByteArrayContent` before saving metadata.

Save route by document level:

- DSMB-level document: `POST dsmb/save/DSMB_DOCUMENT`
- Meeting-level document: `POST dsmbmeeting/save/{dsmbId}/DSMB_MEETING_DOCUMENT`
- Agenda-level document: `POST dsmbmeeting/save/{dsmbId}/DSMB_MEETING_AGENDA_DOCUMENT`

## Suggested migration orchestration

1. Resolve or create DSMB and study associations.
2. Resolve member people and member roles, then add member records if needed.
3. Create meetings using the original meeting date/time and conduct metadata.
4. Create agenda records for each meeting. Use closed session where SharePoint metadata indicates closed or unblinded content.
5. Upload each document at the correct level:
   - DSMB-level for general board documents.
   - Meeting-level for written email review or meeting-level material.
   - Agenda-level for agenda/session-specific material.
6. Send `DocumentStatus = "Final"` for historical files when available, or call `dsmb/document/status` with `IsMarkDocumentStatustoFinal = true` after save.
7. Store the returned CROMS ids and blob URLs back into the migration mapping for QC.

## Special cases

### SAEs

I did not find a dedicated DSMB SAE entity in the DSMB module source. The only SAE references found are in the study support area around AE/SAE/UP management responsibility.

Practical implication: SAE migration probably needs to be represented as DSMB documents and associated to a DSMB, meeting, or agenda. If NIA wants SAEs to appear inside the meeting workflow, the meeting-summary idea of creating synthetic meetings by SAE submission date is consistent with the current API shape.

Open question: identify or create the DSMB document category for SAE material in `DSMB_DOCUMENT_CATEGORY`.

### Historical CVs

Current COI flow treats CV as a COI document category code `COI001` and requires it for COI submission. That is tied to the COI form flow, not a generic historical archive upload path.

Practical implication: historical CVs should either:

- stay as generic protected DSMB documents under a confirmed DSMB document category, or
- be attached through COI/member package flows only where the workflow allows it.

This matches Brett's proposed workaround from the meeting: upload historical CVs as protected generic documents accessible to the right staff.

## Things still needed from CROMS/DB owners

- Stored procedure definitions or sample successful JSON payloads for:
  - `NIA.AP_SAVE_DSMB_DATA_DS_PRO`
  - `NIA.AP_SAVE_DSMB_MEETING_DS_PRO`
  - `NIA.AP_GET_DSMB_DETAILS_DS_PRO`
  - `NIA.AP_GET_DSMB_MEETING_DETAILS_DS_PRO`
- Current LOV exports for:
  - `DSMB_DOCUMENT_CATEGORY`
  - `DSMB_DOCUMENT_STATUS`
  - `DSMB_AGENDA_TYPE`
  - `DSMB_SESSION_TYPE`
  - `DSMB_DISCUSSION_TYPE`
  - `DSMB_MEETING_CONDUCT_MODE`
  - `DSMB_MEETING_TYPES`
  - `DSMB_LEVEL_MEMBER_ROLES`
  - `ISMSO_LEVEL_MEMBER_ROLES`
  - `DSMB_STUDIES`
  - `ISMSO_STUDIES`
- A representative DSMB detail JSON from `GET dsmb/{dsmbId}` and meeting detail JSON from `GET dsmbmeeting/{meetingId}`.
- Confirmation of closed-session permission logic from the stored procedures, especially fields like:
  - `CanAccessDsmbDetails`
  - `AgendaDocumentAccess`
  - `CanManageAgendaDocument`
  - `IncludeUnblindedDataFlag`

## Minimal Excel/JSON mapping columns

Recommended columns for a first proof of concept:

- `legacy_path`
- `legacy_file_name`
- `target_level` (`DSMB`, `MEETING`, `AGENDA`, `COI_GENERIC`)
- `oversight_entity_type`
- `dsmb_name`
- `dsmb_id` if already known
- `study_number`
- `study_id` if already known
- `member_name`
- `member_person_id` if already known
- `member_role_code`
- `meeting_start_time`
- `meeting_end_time`
- `meeting_type`
- `conduct_code`
- `meeting_details`
- `agenda_type`
- `agenda_title`
- `agenda_start_time`
- `session_type`
- `discussion_type`
- `document_category_code`
- `document_status`
- `include_unblinded_data_flag`
- `is_historical_final`
- `special_case` (`SAE`, `CV`, blank)
- `migration_notes`
- `croms_dsmb_id`
- `croms_meeting_id`
- `croms_agenda_id`
- `croms_document_id`
- `croms_blob_url`
