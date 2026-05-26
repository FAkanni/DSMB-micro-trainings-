(function () {
  const trainings = window.DSMB_TRAININGS || [];

  const state = {
    activeTrainingId: trainings[0] ? trainings[0].id : '',
    stepIndex: 0,
    active: false,
    complete: false,
    screen: trainings[0]?.steps[0]?.screen || 'dashboard',
    formValues: {},
    simulation: {}
  };

  const richControls = {
    'list-search': { kind: 'text', value: 'DSMB-TRN-001', exact: true },
    'entity-type': { kind: 'select', answer: 'DSMB' },
    'entity-name': { kind: 'text', value: 'Training DSMB Board 001', exact: true },
    'entity-study': { kind: 'lookup', answer: 'TRAIN-STUDY-001 - Training Study Alpha - TRAIN-GRANT-001' },
    'study-search': { kind: 'lookup', answer: 'TRAIN-STUDY-002 - Training Study Beta - TRAIN-GRANT-002' },
    'member-person': { kind: 'lookup', answer: 'Dr. Reviewer A - Neurology' },
    'member-role': { kind: 'select', answer: 'DSMB Member' },
    'adhoc-person': { kind: 'lookup', answer: 'Dr. Ad Hoc Reviewer A - External Reviewer' },
    'adhoc-study': { kind: 'lookup', answer: 'TRAIN-STUDY-001 - Training Study Alpha' },
    'meeting-type': { kind: 'select', answer: 'Safety Review' },
    'meeting-conduct': { kind: 'select', answer: 'Virtual' },
    'written-conduct': { kind: 'select', answer: 'Written Email Review' },
    'agenda-type': { kind: 'select', answer: 'Open' },
    'agenda-study': { kind: 'lookup', answer: 'TRAIN-STUDY-001 - Training Study Alpha' },
    'email-body': { kind: 'textarea', value: 'Meeting materials are ready for review. Please review the agenda and supporting documents before the meeting.', minLength: 20 },
    'document-category': { kind: 'select', answer: 'Charter' },
    'unblinded-document-category': { kind: 'select', answer: 'Unblinded Meeting Materials' },
    'document-agenda': { kind: 'select', answer: 'Closed Session Part I - TRAIN-STUDY-001' },
    'attendance-mode': { kind: 'select', answer: 'Remote' },
    'coi-member': { kind: 'lookup', answer: 'Dr. Reviewer A - DSMB Member' },
    'coi-question-1': { kind: 'radio', answer: 'Yes' },
    'coi-question-detail': { kind: 'textarea', value: 'Disclosure detail entered for reviewer evaluation.', minLength: 12 },
    'coi-review-outcome': { kind: 'select', answer: 'Approved' },
    'coi-review-comments': { kind: 'textarea', value: 'No disqualifying conflict identified after review.', minLength: 12 },
    'member-outcome': { kind: 'select', answer: 'Eligible to serve as consultant only' },
    'member-comments': { kind: 'textarea', value: 'Recommend consultant-only eligibility due to disclosed relationship.', minLength: 12 }
  };

  const elements = {};

  function init() {
    elements.moduleList = document.getElementById('moduleList');
    elements.stage = document.getElementById('stage');
    elements.trainingTitle = document.getElementById('trainingTitle');
    elements.trainingMeta = document.getElementById('trainingMeta');
    elements.progressFill = document.getElementById('progressFill');
    elements.progressText = document.getElementById('progressText');
    elements.startButton = document.getElementById('startButton');
    elements.backButton = document.getElementById('backButton');
    elements.skipButton = document.getElementById('skipButton');
    elements.resetButton = document.getElementById('resetButton');
    elements.coachmark = document.getElementById('coachmark');
    elements.backdrop = document.getElementById('backdrop');

    elements.startButton.addEventListener('click', () => startTraining(state.activeTrainingId));
    elements.backButton.addEventListener('click', previousStep);
    elements.skipButton.addEventListener('click', skipStep);
    elements.resetButton.addEventListener('click', stopTraining);

    document.addEventListener('click', onDocumentClick);
    document.addEventListener('input', onDocumentInput);
    window.addEventListener('resize', measureCoachmarkSoon);
    window.addEventListener('scroll', measureCoachmarkSoon, true);

    selectTraining(state.activeTrainingId);
  }

  function activeTraining() {
    return trainings.find(training => training.id === state.activeTrainingId) || trainings[0];
  }

  function currentStep() {
    const training = activeTraining();
    return training.steps[state.stepIndex];
  }

  function selectTraining(trainingId) {
    state.activeTrainingId = trainingId;
    state.stepIndex = 0;
    state.active = false;
    state.complete = false;
    resetSimulation();
    state.screen = currentStep().screen;
    render();
  }

  function startTraining(trainingId) {
    state.activeTrainingId = trainingId;
    state.stepIndex = 0;
    state.active = true;
    state.complete = false;
    resetSimulation();
    state.screen = currentStep().screen;
    render();
    measureCoachmark();
    measureCoachmarkSoon();
  }

  function stopTraining() {
    state.active = false;
    state.complete = false;
    render();
  }

  function previousStep() {
    if (!state.active || state.stepIndex === 0) {
      return;
    }

    state.stepIndex -= 1;
    restoreSimulationToCurrentStep();
    render();
    measureCoachmarkSoon();
  }

  function skipStep() {
    if (!state.active) {
      return;
    }

    applyAction(currentStep().targetId);
    advanceStep();
  }

  function onDocumentClick(event) {
    const tourBackButton = event.target.closest('[data-tour-back]');

    if (tourBackButton) {
      previousStep();
      return;
    }

    const tourSkipButton = event.target.closest('[data-tour-skip]');

    if (tourSkipButton) {
      skipStep();
      return;
    }

    const trainingButton = event.target.closest('[data-training-id]');

    if (trainingButton) {
      selectTraining(trainingButton.getAttribute('data-training-id'));
      return;
    }

    const startCardButton = event.target.closest('[data-start-training-id]');

    if (startCardButton) {
      startTraining(startCardButton.getAttribute('data-start-training-id'));
      return;
    }

    if (!state.active) {
      return;
    }

    const step = currentStep();
    const target = event.target.closest(`[data-target="${step.targetId}"]`);

    if (!target) {
      return;
    }

    const control = richControls[step.targetId];

    if (control && ['text', 'textarea'].includes(control.kind)) {
      const field = target.matches('[data-text-target]')
        ? target
        : target.querySelector('[data-text-target]');

      if (field) {
        field.focus();
      }

      return;
    }

    if (control && ['select', 'lookup', 'radio'].includes(control.kind) && !target.hasAttribute('data-control-option')) {
      return;
    }

    applyAction(step.targetId);
    advanceStep();
  }

  function onDocumentInput(event) {
    if (!state.active) {
      return;
    }

    const field = event.target.closest('[data-text-target]');

    if (!field) {
      return;
    }

    const targetId = field.getAttribute('data-text-target');
    const step = currentStep();

    if (targetId !== step.targetId) {
      return;
    }

    const control = richControls[targetId];

    if (!control || !['text', 'textarea'].includes(control.kind)) {
      return;
    }

    state.formValues[targetId] = field.value;

    if (!textEntryComplete(control, field.value)) {
      return;
    }

    applyAction(targetId);
    advanceStep();
  }

  function advanceStep() {
    const training = activeTraining();

    if (state.stepIndex >= training.steps.length - 1) {
      state.active = false;
      state.complete = true;
      render();
      return;
    }

    state.stepIndex += 1;
    state.screen = currentStep().screen;
    render();
    measureCoachmarkSoon();
  }

  function restoreSimulationToCurrentStep() {
    const training = activeTraining();
    const completedSteps = training.steps.slice(0, state.stepIndex);

    resetSimulation();

    completedSteps.forEach(step => applyAction(step.targetId));
    state.screen = currentStep().screen;
  }

  function resetSimulation() {
    const id = state.activeTrainingId;

    state.formValues = {};
    state.simulation = {
      listFiltered: false,
      entitySaved: id !== 'create-entity',
      entityTypeSelected: false,
      entityNameEntered: false,
      entityStudySelected: false,
      detailsReviewed: false,
      studiesExpanded: false,
      studySelected: false,
      studyAdded: id !== 'add-study',
      membersExpanded: false,
      memberSelected: false,
      memberRoleSelected: false,
      memberAdded: id !== 'add-member',
      adhocSelected: false,
      adhocStudySelected: false,
      adhocAdded: id !== 'add-adhoc-member',
      meetingsExpanded: false,
      meetingTypeSelected: false,
      meetingConductSelected: false,
      meetingCreated: !['create-meeting', 'ismso-written-review'].includes(id),
      meetingStatus: id === 'run-meeting' ? 'Published' : 'Draft',
      agendaExpanded: false,
      agendaTypeSelected: false,
      agendaStudySelected: false,
      agendaAdded: ['publish-meeting', 'run-meeting', 'document-review'].includes(id),
      emailRecipientsReviewed: false,
      emailBodyReviewed: false,
      emailDraftSaved: false,
      emailPreviewed: false,
      conductExpanded: false,
      attendanceOpened: false,
      attendanceModeSelected: false,
      attendanceSaved: false,
      documentsOpened: false,
      documentCategorySelected: false,
      unblindedCategorySelected: false,
      documentAgendaSelected: false,
      documentUploaded: false,
      documentSaved: ['document-review', 'workflow-recovery'].includes(id),
      documentCheckedOut: false,
      documentCheckedIn: false,
      closedAgendaSelected: false,
      agendaDocumentsOpened: false,
      documentReviewInitiated: false,
      nextReviewersReviewed: false,
      validationFailed: false,
      prerequisiteFixed: false,
      coiPanelOpened: false,
      coiMemberSelected: false,
      coiContextReviewed: false,
      coiCreated: id === 'submit-coi',
      coiHeaderReviewed: false,
      coiQuestionAnswered: false,
      coiDetailEntered: false,
      coiSaved: false,
      coiSubmitted: id === 'review-coi',
      coiDashboardFiltered: false,
      coiReviewOpened: false,
      coiResponsesReviewed: false,
      coiOutcomeSelected: false,
      coiReviewComments: false,
      coiReviewSubmitted: false,
      memberDashboardFiltered: false,
      memberPackageOpened: false,
      memberOutcomeSelected: false,
      memberComments: false,
      memberConfirmed: false,
      memberSubmitted: false,
      isIsmso: id === 'ismso-written-review',
      writtenConductSelected: false
    };
  }

  function applyAction(targetId) {
    const sim = state.simulation;
    const control = richControls[targetId];

    if (control && ['text', 'textarea'].includes(control.kind) && !state.formValues[targetId]) {
      state.formValues[targetId] = control.value;
    }

    switch (targetId) {
      case 'nav-safety':
        state.screen = 'dsmb-list';
        break;
      case 'list-search':
        sim.listFiltered = true;
        break;
      case 'view-ismso':
        sim.isIsmso = true;
        state.screen = 'ismso-list';
        break;
      case 'ismso-row':
        sim.isIsmso = true;
        state.screen = 'ismso-details';
        break;
      case 'entity-row':
        if (['build-agenda', 'publish-meeting'].includes(state.activeTrainingId)) {
          sim.meetingsExpanded = true;
        }
        state.screen = 'details';
        break;
      case 'details-panels':
        sim.detailsReviewed = true;
        state.screen = 'dsmb-list';
        break;
      case 'add-entity':
        state.screen = 'entity-modal';
        break;
      case 'entity-type':
        sim.entityTypeSelected = true;
        break;
      case 'entity-name':
        sim.entityNameEntered = true;
        break;
      case 'entity-study':
        sim.entityStudySelected = true;
        break;
      case 'entity-save':
        sim.entitySaved = true;
        state.screen = 'dsmb-list';
        break;
      case 'studies-panel':
        sim.studiesExpanded = true;
        break;
      case 'add-study':
        state.screen = 'study-modal';
        break;
      case 'study-search':
        sim.studySelected = true;
        break;
      case 'study-save':
        sim.studyAdded = true;
        state.screen = 'details';
        break;
      case 'studies-row-new':
        break;
      case 'members-panel':
        sim.membersExpanded = true;
        break;
      case 'add-member':
        state.screen = 'member-modal';
        break;
      case 'member-person':
        sim.memberSelected = true;
        break;
      case 'member-role':
        sim.memberRoleSelected = true;
        break;
      case 'member-save':
        sim.memberAdded = true;
        state.screen = 'details';
        break;
      case 'member-row-new':
        break;
      case 'add-adhoc':
        state.screen = 'adhoc-modal';
        break;
      case 'adhoc-person':
        sim.adhocSelected = true;
        break;
      case 'adhoc-study':
        sim.adhocStudySelected = true;
        break;
      case 'adhoc-save':
        sim.adhocAdded = true;
        state.screen = 'details';
        break;
      case 'adhoc-row-new':
        break;
      case 'meetings-panel':
        sim.meetingsExpanded = true;
        break;
      case 'add-meeting':
        state.screen = 'meeting-modal';
        break;
      case 'meeting-type':
        sim.meetingTypeSelected = true;
        break;
      case 'meeting-conduct':
        sim.meetingConductSelected = true;
        break;
      case 'written-conduct':
        sim.writtenConductSelected = true;
        sim.meetingConductSelected = true;
        break;
      case 'meeting-save':
        sim.meetingCreated = true;
        sim.meetingStatus = 'Draft';
        state.screen = 'meeting-details';
        break;
      case 'agenda-panel':
        sim.agendaExpanded = true;
        break;
      case 'add-agenda':
        state.screen = 'agenda-modal';
        break;
      case 'agenda-type':
        sim.agendaTypeSelected = true;
        break;
      case 'agenda-study':
        sim.agendaStudySelected = true;
        break;
      case 'agenda-save':
        sim.agendaAdded = true;
        sim.prerequisiteFixed = true;
        state.screen = state.activeTrainingId === 'workflow-recovery' ? 'workflow-dialog' : 'meeting-details';
        break;
      case 'agenda-row-new':
        break;
      case 'closed-agenda-row':
        sim.closedAgendaSelected = true;
        state.screen = 'agenda-documents';
        break;
      case 'draft-email':
        state.screen = 'email-modal';
        break;
      case 'email-recipients':
        sim.emailRecipientsReviewed = true;
        break;
      case 'email-body':
        sim.emailBodyReviewed = true;
        break;
      case 'save-draft':
        sim.emailDraftSaved = true;
        break;
      case 'preview-email':
        sim.emailPreviewed = true;
        break;
      case 'publish-email':
        sim.emailDraftSaved = true;
        sim.meetingStatus = 'Published';
        state.screen = 'meeting-details';
        break;
      case 'start-meeting':
        sim.meetingStatus = 'In Progress';
        break;
      case 'conduct-panel':
        sim.conductExpanded = true;
        break;
      case 'attendance-capture':
        sim.attendanceOpened = true;
        break;
      case 'attendance-mode':
        sim.attendanceModeSelected = true;
        break;
      case 'attendance-save':
        sim.attendanceSaved = true;
        break;
      case 'end-meeting':
        sim.meetingStatus = 'Completed';
        break;
      case 'meeting-status':
        break;
      case 'meeting-title':
        state.screen = 'meeting-details';
        break;
      case 'published-meeting-row':
      case 'published-meeting-status':
        break;
      case 'documents-panel':
        sim.documentsOpened = true;
        state.screen = 'documents';
        break;
      case 'add-document':
        state.screen = 'document-modal';
        break;
      case 'document-category':
        sim.documentCategorySelected = true;
        break;
      case 'unblinded-document-category':
        sim.unblindedCategorySelected = true;
        break;
      case 'document-agenda':
        sim.documentAgendaSelected = true;
        break;
      case 'document-upload':
        sim.documentUploaded = true;
        break;
      case 'document-save':
        sim.documentSaved = true;
        state.screen = state.activeTrainingId === 'upload-unblinded-closed-agenda' ? 'agenda-documents' : 'documents';
        break;
      case 'document-row-new':
      case 'published-document-row':
        break;
      case 'document-checkout':
        sim.documentCheckedOut = true;
        break;
      case 'document-checkin':
        sim.documentCheckedIn = true;
        break;
      case 'document-review-action':
        if (state.activeTrainingId === 'workflow-recovery' && !sim.prerequisiteFixed) {
          sim.validationFailed = true;
          state.screen = 'validation-error';
        } else {
          state.screen = 'workflow-dialog';
        }
        break;
      case 'workflow-summary':
        break;
      case 'workflow-confirm':
        sim.validationFailed = false;
        sim.documentReviewInitiated = true;
        state.screen = 'documents';
        break;
      case 'document-review-status':
        break;
      case 'document-next-reviewers':
        sim.nextReviewersReviewed = true;
        break;
      case 'validation-message':
        sim.validationFailed = true;
        break;
      case 'fix-prereq':
        state.screen = 'meeting-details';
        break;
      case 'coi-panel':
        sim.coiPanelOpened = true;
        state.screen = 'coi-panel';
        break;
      case 'report-coi':
        state.screen = 'coi-modal';
        break;
      case 'coi-member':
        sim.coiMemberSelected = true;
        break;
      case 'coi-context':
        sim.coiContextReviewed = true;
        break;
      case 'coi-create':
        sim.coiCreated = true;
        state.screen = 'coi-form';
        break;
      case 'coi-form-header':
        sim.coiHeaderReviewed = true;
        break;
      case 'coi-question-1':
        sim.coiQuestionAnswered = true;
        break;
      case 'coi-question-detail':
        sim.coiDetailEntered = true;
        break;
      case 'coi-save':
        sim.coiSaved = true;
        break;
      case 'coi-submit':
        state.screen = 'esignature';
        break;
      case 'esign-confirm':
        sim.coiSubmitted = true;
        state.screen = 'coi-form';
        break;
      case 'coi-status':
        break;
      case 'coi-dashboard-link':
        state.screen = 'coi-dashboard';
        break;
      case 'coi-filter-my-task':
        sim.coiDashboardFiltered = true;
        break;
      case 'coi-dashboard-row':
        sim.coiReviewOpened = true;
        state.screen = 'coi-review';
        break;
      case 'coi-review-responses':
        sim.coiResponsesReviewed = true;
        break;
      case 'coi-review-outcome':
        sim.coiOutcomeSelected = true;
        break;
      case 'coi-review-comments':
        sim.coiReviewComments = true;
        break;
      case 'coi-review-submit':
        sim.coiReviewSubmitted = true;
        break;
      case 'member-dashboard-link':
        state.screen = 'member-dashboard';
        break;
      case 'member-filter-my-task':
        sim.memberDashboardFiltered = true;
        break;
      case 'member-package-row':
        sim.memberPackageOpened = true;
        state.screen = 'member-package';
        break;
      case 'member-outcome':
        sim.memberOutcomeSelected = true;
        break;
      case 'member-comments':
        sim.memberComments = true;
        break;
      case 'member-confirm':
        sim.memberConfirmed = true;
        break;
      case 'member-submit':
        sim.memberSubmitted = true;
        break;
    }
  }

  function render() {
    const training = activeTraining();
    const step = currentStep();
    const stepCount = training.steps.length;
    const progress = state.complete ? 100 : state.active ? Math.round(((state.stepIndex + 1) / stepCount) * 100) : 0;

    elements.trainingTitle.textContent = training.title;
    elements.trainingMeta.innerHTML = `
      <span><strong>Role</strong> ${escapeHtml(training.role)}</span>
      <span><strong>Route</strong> ${escapeHtml(training.route)}</span>
      <span><strong>Screen</strong> ${escapeHtml(screenLabel(state.screen))}</span>
    `;
    elements.progressFill.style.width = `${progress}%`;
    elements.progressText.textContent = state.complete
      ? 'Complete'
      : state.active
        ? `Step ${state.stepIndex + 1} of ${stepCount}`
        : 'Ready';
    elements.startButton.textContent = state.active ? 'Restart Walkthrough' : 'Start Walkthrough';
    elements.backButton.disabled = !state.active || state.stepIndex === 0;
    elements.skipButton.disabled = !state.active;
    elements.resetButton.disabled = !state.active && !state.complete;

    renderModuleList();
    elements.stage.innerHTML = renderStage();
    renderCoachmark(step);
  }

  function renderModuleList() {
    const grouped = trainings.reduce((acc, training) => {
      acc[training.group] = acc[training.group] || [];
      acc[training.group].push(training);
      return acc;
    }, {});

    elements.moduleList.innerHTML = Object.keys(grouped).map(group => `
      <section class="module-group">
        <h3>${escapeHtml(group)}</h3>
        ${grouped[group].map(training => `
          <article class="module-card ${training.id === state.activeTrainingId ? 'selected' : ''}">
            <button type="button" class="module-select" data-training-id="${escapeHtml(training.id)}">
              <span class="module-icon" aria-hidden="true">${moduleInitials(training.title)}</span>
              <span>
                <strong>${escapeHtml(training.title)}</strong>
                <small>${escapeHtml(training.role)} · ${escapeHtml(training.duration)}</small>
              </span>
            </button>
            <p>${escapeHtml(training.summary)}</p>
            <button type="button" class="mini-action" data-start-training-id="${escapeHtml(training.id)}">Start</button>
          </article>
        `).join('')}
      </section>
    `).join('');
  }

  function renderStage() {
    return `
      <div class="croms-frame">
        ${renderAppBar()}
        ${renderBreadcrumbs()}
        <main class="inner-container-sim">
          ${state.complete ? renderCompletion() : renderScreen()}
        </main>
      </div>
    `;
  }

  function renderAppBar() {
    return `
      <header id="app-header-sim">
        <div class="primary-header blue-100 shadow-1 scroll-1">
          <div class="inner">
            <div>
              <h1 class="text-white zero-pad">National Institute on Aging</h1>
              <h2 class="text-blue-25 zero-pad">Clinical Research Operations &amp; Management System (CROMS)</h2>
            </div>
            <div class="user-info">
              <button type="button" class="avatar btn custom-focus" aria-label="User Settings">
                <span class="fa-user-circle" aria-hidden="true">●</span>
              </button>
            </div>
          </div>
        </div>
      </header>
    `;
  }

  function renderBreadcrumbs() {
    const parts = breadcrumbParts();

    return `
      <div id="breadcrumbs-sim">
        <div class="inner">
          <div class="crumbs">
            <span class="home-icon" aria-hidden="true">⌂</span>
            ${parts.length === 0
              ? '<strong>Home</strong>'
              : `<a>Home</a>${parts.map((part, index) => `
                  <span class="chevron">›</span>${index === parts.length - 1 ? `<strong>${escapeHtml(part)}</strong>` : `<a>${escapeHtml(part)}</a>`}
                `).join('')}`}
          </div>
          <div>
            <button type="button" class="hamburger btn icon-btn custom-focus" aria-label="Full Navigation Menu">
              <span aria-hidden="true">☰</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function breadcrumbParts() {
    switch (state.screen) {
      case 'dashboard':
        return [];
      case 'dsmb-list':
      case 'ismso-list':
      case 'entity-modal':
      case 'member-dashboard':
      case 'coi-dashboard':
        return ['Safety Monitoring Oversight', screenLabel(state.screen)];
      case 'details':
      case 'ismso-details':
      case 'study-modal':
      case 'member-modal':
      case 'adhoc-modal':
      case 'documents':
      case 'document-modal':
      case 'workflow-dialog':
      case 'validation-error':
      case 'coi-panel':
      case 'coi-modal':
        return ['Safety Monitoring Oversight', 'DSMB Details'];
      case 'meeting-modal':
      case 'meeting-details':
      case 'agenda-modal':
      case 'email-modal':
        return ['Safety Monitoring Oversight', 'DSMB Details', 'Meeting Details'];
      case 'coi-form':
      case 'esignature':
      case 'coi-review':
        return ['Safety Monitoring Oversight', 'DSMB Details', 'COI Form'];
      case 'member-package':
        return ['Safety Monitoring Oversight', 'Member Approval Package'];
      default:
        return [screenLabel(state.screen)];
    }
  }

  function renderScreen() {
    switch (state.screen) {
      case 'dashboard':
        return renderDashboard();
      case 'dsmb-list':
        return renderDsmbList();
      case 'ismso-list':
        return renderIsmsoList();
      case 'details':
        return renderDetails(false);
      case 'ismso-details':
        return renderDetails(true);
      case 'entity-modal':
        return renderEntityModal();
      case 'study-modal':
        return renderStudyModal();
      case 'member-modal':
        return renderMemberModal(false);
      case 'adhoc-modal':
        return renderMemberModal(true);
      case 'meeting-modal':
        return renderMeetingModal();
      case 'meeting-details':
        return renderMeetingDetails();
      case 'agenda-modal':
        return renderAgendaModal();
      case 'agenda-documents':
        return renderAgendaDocuments();
      case 'email-modal':
        return renderEmailModal();
      case 'documents':
        return renderDocuments();
      case 'document-modal':
        return renderDocumentModal();
      case 'workflow-dialog':
        return renderWorkflowDialog();
      case 'validation-error':
        return renderValidationError();
      case 'coi-panel':
        return renderCoiPanel();
      case 'coi-modal':
        return renderCoiModal();
      case 'coi-form':
        return renderCoiForm();
      case 'esignature':
        return renderEsignature();
      case 'coi-dashboard':
        return renderCoiDashboard();
      case 'coi-review':
        return renderCoiReview();
      case 'member-dashboard':
        return renderMemberDashboard();
      case 'member-package':
        return renderMemberPackage();
      default:
        return renderDashboard();
    }
  }

  function renderDashboard() {
    if (isProgramOfficerFindTraining()) {
      return renderProgramOfficerDashboard();
    }

    if (isDsmbMemberFindTraining()) {
      return renderDsmbMemberDashboard();
    }

    return `
      <section class="dashboard-card shadow-1 bg-white">
        <div class="row tile-row">
          ${dashboardTile('assets/images/tiles/Dashboard_Tile_Grant Mgr.png', 'Grant Manager')}
          ${dashboardTile('assets/images/tiles/Dashboard_Tile_Study Mgr.png', 'Study Manager')}
          <button type="button" class="tile-button" data-target="nav-safety" title="DSMB/ISM/SO">
            <img src="assets/images/tiles/Dashboard_Tiles_DSMB-ISM-SO.png" width="201" height="200" alt="DSMB/ISM/SO">
          </button>
          ${dashboardTile('assets/images/tiles/Dashboard_Tile_DocManager.png', 'Document Manager')}
        </div>
      </section>
    `;
  }

  function renderProgramOfficerDashboard() {
    return `
      <section class="dashboard-card role-dashboard program-officer-home shadow-1 bg-white">
        <div class="row tile-row po-tile-row">
          ${dashboardTextTile('My Dashboard', 'dashboard')}
          ${dashboardTile('assets/images/tiles/Dashboard_Tile_Grant Mgr.png', 'Grant Manager')}
          ${dashboardTile('assets/images/tiles/Dashboard_Tile_Study Mgr.png', 'Study Manager')}
          ${dashboardTextTile('Analytics & Visualization', 'analytics')}
          <button type="button" class="tile-button" data-target="nav-safety" title="DSMB/ISM/SO">
            <img src="assets/images/tiles/Dashboard_Tiles_DSMB-ISM-SO.png" width="201" height="200" alt="DSMB/ISM/SO">
          </button>
        </div>
      </section>
    `;
  }

  function renderDsmbMemberDashboard() {
    return `
      <section class="dashboard-card role-dashboard dsmb-member-home shadow-1 bg-white">
        <div class="row tile-row member-tile-row">
          ${dashboardTextTile('My Dashboard', 'dashboard')}
          <button type="button" class="tile-button" data-target="nav-safety" title="DSMB/ISM/SO">
            <img src="assets/images/tiles/Dashboard_Tiles_DSMB-ISM-SO.png" width="201" height="200" alt="DSMB/ISM/SO">
          </button>
        </div>
      </section>
    `;
  }

  function renderDsmbList() {
    const sim = state.simulation;
    const isProgramOfficer = isProgramOfficerFindTraining();
    const isDsmbMember = isDsmbMemberFindTraining();
    const meta = isProgramOfficer
      ? [
          ['Role View', 'Program Officer'],
          ['Assigned DSMBs', '3'],
          ['Filtered', sim.listFiltered ? 'Yes' : 'No']
        ]
      : isDsmbMember
        ? [
            ['Role View', 'DSMB Member'],
            ['Assigned DSMBs', '2'],
            ['Filtered', sim.listFiltered ? 'Yes' : 'No']
          ]
        : [
            ['DSMBs', sim.entitySaved ? '12' : '11'],
            ['Open Workflows', '4'],
            ['Filtered', sim.listFiltered ? 'Yes' : 'No']
          ];
    const description = isProgramOfficer
      ? 'View DSMB and ISM/SO records for studies assigned to the Program Officer.'
      : isDsmbMember
        ? 'View DSMB and ISM/SO records assigned to the DSMB Member.'
        : 'Manage Data and Safety Monitoring Boards.';
    const searchPlaceholder = isProgramOfficer
      ? 'Search DSMB name, study number, grant number, chair, or PO'
      : isDsmbMember
        ? 'Search DSMB name, study number, meeting, or chair'
        : 'Search DSMB name, study number, PO, or chair';
    const actions = isProgramOfficer || isDsmbMember
      ? `
          <button type="button" class="ism-switch-link" data-target="view-ismso">
            <span class="ism-switch-icon" aria-hidden="true"></span>
            <span>View ISM/SO(s)</span>
          </button>
        `
      : `
          <button type="button" class="btn list-switch-btn" data-target="view-ismso"><span>View ISM/SO(s)</span></button>
          <button type="button" class="btn btn-primary" data-target="member-dashboard-link">Member Approval Package Dashboard</button>
          <button type="button" class="btn btn-primary" data-target="coi-dashboard-link">COI Dashboard</button>
          <button type="button" class="btn btn-primary" data-target="add-entity">Add</button>
        `;

    return `
      <section class="screen-with-header">
        ${screenHeader('DSMB List', description, meta, actions)}
        <div class="below-sub-header">
          <div class="list-table-container shadow-1 bg-white rounded">
            <div class="table-controls" data-target="list-search">
              <div class="main-controls">
                ${searchInput('list-search', sim.listFiltered, state.formValues['list-search'] || 'DSMB-TRN-001', searchPlaceholder)}
                <span class="filter-chip">${sim.listFiltered ? 'Filtered results' : isProgramOfficer ? 'Assigned records' : isDsmbMember ? 'My DSMB records' : 'All records'}</span>
              </div>
            </div>
            <div class="table-wrap">
              <table class="table list-table">
            <thead>
              <tr>
                <th>DSMB Name</th>
                <th>Chair</th>
                <th>Study Number</th>
                ${isProgramOfficer ? '<th>Grant Number</th><th>Program Officer</th>' : ''}
                <th>Next Scheduled Meeting</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${sim.entitySaved ? `
                <tr>
                  <td><button type="button" class="link-button" data-target="entity-row">Training DSMB Board 001</button></td>
                  <td>Dr. Chair A</td>
                  <td>TRAIN-STUDY-001</td>
                  ${isProgramOfficer ? '<td>TRAIN-GRANT-001</td><td>Dr. Program Officer A</td>' : ''}
                  <td>06/18/2026 10:00 AM</td>
                  <td><span class="status-pill good">Active</span></td>
                </tr>
              ` : ''}
              <tr>
                <td><button type="button" class="link-button">Training DSMB Board 002</button></td>
                <td>Dr. Reviewer B</td>
                <td>TRAIN-STUDY-003</td>
                ${isProgramOfficer ? '<td>TRAIN-GRANT-003</td><td>Dr. Program Officer A</td>' : ''}
                <td>05/27/2026 01:00 PM</td>
                <td><span class="status-pill info">Active</span></td>
              </tr>
              <tr>
                <td><button type="button" class="link-button">Training DSMB Board 003</button></td>
                <td>Dr. Reviewer C</td>
                <td>TRAIN-STUDY-004</td>
                ${isProgramOfficer ? '<td>TRAIN-GRANT-004</td><td>Dr. Program Officer A</td>' : ''}
                <td>07/09/2026 11:30 AM</td>
                <td><span class="status-pill warn">COI Due</span></td>
              </tr>
            </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  function renderIsmsoList() {
    const isProgramOfficer = isProgramOfficerFindTraining();
    const isDsmbMember = isDsmbMemberFindTraining();
    const description = isProgramOfficer
      ? 'View ISM and Safety Officer records for studies assigned to the Program Officer.'
      : isDsmbMember
        ? 'View ISM and Safety Officer records assigned to the DSMB Member.'
        : 'Manage Independent Safety Monitor and Safety Officer records.';
    const meta = isProgramOfficer
      ? [
          ['Role View', 'Program Officer'],
          ['Assigned ISM/SOs', '2'],
          ['Mode', 'ISM/SO']
        ]
      : isDsmbMember
        ? [
            ['Role View', 'DSMB Member'],
            ['Assigned ISM/SOs', '2'],
            ['Mode', 'ISM/SO']
          ]
        : [
            ['ISM/SOs', '6'],
            ['Written Reviews', '3'],
            ['Mode', 'ISM/SO']
          ];

    return `
      <section class="screen-with-header">
        ${screenHeader('ISM/SO List', description, meta)}
        <div class="below-sub-header">
          <div class="list-table-container shadow-1 bg-white rounded">
            <div class="table-controls">
              <div class="main-controls">
                <div class="croms-search-control">
                  <span>Search ISM/SO name, study number, grant number, or safety officer</span>
                </div>
                <span class="filter-chip">${isProgramOfficer ? 'Assigned records' : isDsmbMember ? 'My ISM/SO records' : 'All records'}</span>
              </div>
            </div>
            <div class="table-wrap">
              <table class="table list-table">
            <thead>
              <tr>
                <th>ISM/SO Name</th>
                <th>ISM/SO</th>
                <th>Study Number</th>
                ${(isProgramOfficer || isDsmbMember) ? '<th>Grant Number</th>' : ''}
                ${isProgramOfficer ? '<th>Program Officer</th>' : ''}
                <th>Next Review</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><button type="button" class="link-button" data-target="ismso-row">Training ISM/SO Office 001</button></td>
                <td>Dr. Safety Officer A</td>
                <td>TRAIN-STUDY-005</td>
                ${(isProgramOfficer || isDsmbMember) ? '<td>TRAIN-GRANT-005</td>' : ''}
                ${isProgramOfficer ? '<td>Dr. Program Officer A</td>' : ''}
                <td>Written Review pending</td>
                <td><span class="status-pill warn">Pending Review</span></td>
              </tr>
              <tr>
                <td><button type="button" class="link-button">ISM/SO-014 Safety Officer Review</button></td>
                <td>Dr. Safety Officer B</td>
                <td>TRAIN-STUDY-006</td>
                ${(isProgramOfficer || isDsmbMember) ? '<td>TRAIN-GRANT-006</td>' : ''}
                ${isProgramOfficer ? '<td>Dr. Program Officer A</td>' : ''}
                <td>06/03/2026 09:00 AM</td>
                <td><span class="status-pill good">Active</span></td>
              </tr>
            </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  function renderDetails(isIsmso, forcedSection = '') {
    const sim = state.simulation;
    const title = isIsmso ? 'Training ISM/SO Office 001' : 'Training DSMB (Study Alpha; TRAIN-GRANT-001)';
    const selectedSection = forcedSection
      ? sectionLabel(forcedSection)
      : isIsmso
        ? 'Meetings'
        : 'Go To Section';
    const meetingsExpanded = forcedSection === 'meetings' || sim.meetingsExpanded || ['create-meeting', 'ismso-written-review'].includes(state.activeTrainingId);
    const membersExpanded = forcedSection === 'members' || sim.membersExpanded || ['add-member', 'add-adhoc-member'].includes(state.activeTrainingId);
    const studiesExpanded = forcedSection === 'studies' || sim.studiesExpanded || state.activeTrainingId === 'add-study';
    const documentsExpanded = forcedSection === 'documents' || sim.documentsOpened;
    const coiExpanded = forcedSection === 'coi' || sim.coiPanelOpened;
    const memberApprovalExpanded = forcedSection === 'member-approval';

    return `
      <section class="screen-with-header">
        ${detailsHeader(title, [
          [isIsmso ? 'ISM/SO' : 'DSMB Chair', isIsmso ? 'Dr. Safety Officer A' : 'Dr. Chair A'],
          ['PO', 'Dr. Program Officer A'],
          ['Last Completed Meeting', '02/19/2026 12:00 PM - 01:30 PM ET'],
          ['Next Scheduled Meeting', sim.meetingCreated ? '07/15/2026 10:00 AM - 12:00 PM ET' : 'N/A']
        ], selectedSection)}
        <div class="below-sub-header">
          <div id="editStudyGroup" data-target="details-panels">
            ${detailAccordion('Meetings', sim.meetingCreated ? '1' : '0', 'meetings-panel', meetingsExpanded, renderMeetingsPanel(isIsmso))}
            ${detailAccordion('Key Stakeholders', sim.memberAdded || sim.adhocAdded ? '34' : '33', 'members-panel', membersExpanded, renderMembersPanel())}
            ${detailAccordion('Studies', sim.studyAdded ? '2' : '1', 'studies-panel', studiesExpanded, renderStudiesPanel())}
            ${detailAccordion('Documents', sim.documentSaved ? '4' : '3', 'documents-panel', documentsExpanded, renderDocumentsPanel())}
            ${detailAccordion('Conflict of Interest', sim.coiCreated ? '5' : '4', 'coi-panel', coiExpanded, renderCoiDetailsPanel())}
            ${detailAccordion('Member Approval', '0', '', memberApprovalExpanded, renderMemberApprovalPanel())}
          </div>
        </div>
      </section>
    `;
  }

  function renderMeetingsPanel(isIsmso) {
    const sim = state.simulation;
    const meetingType = isIsmso ? 'Written Review' : 'Bi-Annual Review';
    const conduct = isIsmso ? 'Written Email Review' : 'Virtual';
    const showPublishedAccessMeeting = state.activeTrainingId === 'access-meetings-program-officer';
    const showPreparedMeeting = ['build-agenda', 'publish-meeting'].includes(state.activeTrainingId);
    const rows = [];

    if (showPublishedAccessMeeting || showPreparedMeeting) {
      rows.push([
        `<button type="button" class="link-button" data-target="${showPreparedMeeting ? 'meeting-title' : 'published-meeting-row'}">02/19/2026 12:00 PM - 01:30 PM ET</button>`,
        'TRAIN-STUDY-001',
        'Training Study Alpha',
        'Virtual',
        'Safety Review',
        'Secure web conference link',
        `<span class="status-pill good" data-target="${showPreparedMeeting ? 'meeting-title' : 'published-meeting-status'}">Published</span>`
      ]);
    }

    if (sim.meetingCreated) {
      rows.push([
        '<button type="button" class="link-button">06/18/2026 10:00 AM - 12:00 PM ET</button>',
        'TRAIN-STUDY-001',
        'Training Study Alpha',
        conduct,
        meetingType,
        isIsmso ? 'Written materials packet' : 'Secure web conference link',
        `<span class="status-pill ${statusClass(sim.meetingStatus)}" data-target="meeting-status">${escapeHtml(sim.meetingStatus)}</span>`
      ]);
    }

    return `
      <div class="detail-subsection">
        ${sectionTableHeader('Meetings', `
          <button type="button" class="inline-action">Export Meetings</button>
          <button type="button" class="inline-action add" data-target="add-meeting">+ Add Meeting</button>
        `)}
        ${cromsTable({
          range: rows.length ? `1-${rows.length} of ${rows.length}` : '0-0 of 0',
          columns: ['Meeting Date / Time (ET)', 'Study Number', 'Study Title', 'Conduct Mode', 'Meeting Type', 'In Person/Virtual Details', 'Meeting Status'],
          rows,
          emptyColumns: 7
        })}
      </div>
    `;
  }

  function renderMembersPanel() {
    const sim = state.simulation;
    const dsmbRows = [
      ['Dr. Chair A', 'DSMB Chair', 'TRAIN-STUDY-001', '02/19/2026 12:00 PM - 01:30 PM ET', '07/15/2026 10:00 AM - 12:00 PM ET', kebabButton()],
      ['Dr. Reviewer B', 'DSMB Member', 'TRAIN-STUDY-001', '02/19/2026 12:00 PM - 01:30 PM ET', '07/15/2026 10:00 AM - 12:00 PM ET', kebabButton()],
      ['Dr. Reviewer C', 'DSMB Member', 'TRAIN-STUDY-001', '02/19/2026 12:00 PM - 01:30 PM ET', '07/15/2026 10:00 AM - 12:00 PM ET', kebabButton()],
      ['Dr. Reviewer D', 'DSMB Member', 'TRAIN-STUDY-001', '02/19/2026 12:00 PM - 01:30 PM ET', '07/15/2026 10:00 AM - 12:00 PM ET', kebabButton()]
    ];

    if (sim.memberAdded) {
      dsmbRows.push([
        '<button type="button" class="link-button" data-target="member-row-new">Dr. Reviewer A</button>',
        'DSMB Member',
        'TRAIN-STUDY-001',
        'N/A',
        '07/15/2026 10:00 AM - 12:00 PM ET',
        kebabButton()
      ]);
    }

    const adhocRows = sim.adhocAdded
      ? [[
          '<button type="button" class="link-button" data-target="adhoc-row-new">Dr. Ad Hoc Reviewer A</button>',
          'Ad Hoc DSMB Member',
          'TRAIN-STUDY-001',
          'N/A',
          '07/15/2026 10:00 AM - 12:00 PM ET',
          kebabButton()
        ]]
      : [];

    return `
      <div class="detail-subsection">
        ${sectionTableHeader('DSMB Members', '<button type="button" class="inline-action add" data-target="add-member">+ Add Member</button>')}
        ${cromsTable({
          rowsPerPage: '10',
          range: `1-${dsmbRows.length} of ${dsmbRows.length}`,
          columns: ['Name', 'Role', 'Associated Study Number', 'Last Meeting Attended Date / Time (ET)', 'Next Meeting Scheduled Date / Time (ET)', 'Actions'],
          rows: dsmbRows
        })}
      </div>
      <div class="detail-subsection">
        ${sectionTableHeader('Ad Hoc DSMB Members', '<button type="button" class="inline-action add" data-target="add-adhoc">+ Add Ad Hoc</button>')}
        ${cromsTable({
          rowsPerPage: '10',
          range: adhocRows.length ? '1-1 of 1' : '0-0 of 0',
          columns: ['Name', 'Role', 'Associated Study Number', 'Last Meeting Attended Date / Time (ET)', 'Next Meeting Scheduled Date / Time (ET)', 'Actions'],
          rows: adhocRows,
          emptyColumns: 6
        })}
      </div>
      <div class="detail-subsection">
        ${sectionTableHeader('Study Team Members')}
        ${cromsTable({
          rowsPerPage: '20',
          range: '1-3 of 3',
          columns: ['Name', 'Role', 'Associated Study Number', 'Last Meeting Attended Date / Time (ET)', 'Next Meeting Scheduled Date / Time (ET)'],
          rows: [
            ['Dr. Study PI A', 'Study PI', 'TRAIN-STUDY-001', '02/19/2026 12:00 PM - 01:30 PM ET', '07/15/2026 10:00 AM - 12:00 PM ET'],
            ['Study Coordinator A', 'Research Coordinator', 'TRAIN-STUDY-001', '02/19/2026 12:00 PM - 01:30 PM ET', '07/15/2026 10:00 AM - 12:00 PM ET'],
            ['Dr. Study Co-PI A', 'Co-Principal Investigator', 'TRAIN-STUDY-001', '02/19/2026 12:00 PM - 01:30 PM ET', '07/15/2026 10:00 AM - 12:00 PM ET']
          ]
        })}
      </div>
    `;
  }

  function renderStudiesPanel() {
    const sim = state.simulation;
    const rows = [
      ['TRAIN-STUDY-001', 'Training Study Alpha', 'Recruiting', 'Dr. Program Officer A', '02/19/2026 12:00 PM - 01:30 PM ET', '07/15/2026 10:00 AM - 12:00 PM ET', kebabButton()]
    ];

    if (sim.studyAdded) {
      rows.push([
        '<button type="button" class="link-button" data-target="studies-row-new">TRAIN-STUDY-002</button>',
        'Training Study Beta',
        'Active',
        'Dr. Program Officer B',
        'N/A',
        'N/A',
        kebabButton()
      ]);
    }

    return `
      <div class="detail-subsection">
        ${sectionTableHeader('Studies', '<button type="button" class="inline-action add" data-target="add-study">+ Add Study</button>')}
        ${cromsTable({
          rowsPerPage: '10',
          range: `1-${rows.length} of ${rows.length}`,
          columns: ['Study Number', 'Study Title', 'Study Status', 'PO Name', 'Last Meeting Attended Date / Time (ET)', 'Next Meeting Scheduled Date / Time (ET)', 'Actions'],
          rows
        })}
      </div>
    `;
  }

  function renderDocumentsPanel() {
    const sim = state.simulation;
    const checkInOutTraining = ['checkin-document-chair', 'checkin-document-program-officer'].includes(state.activeTrainingId);
    const checkoutAction = sim.documentCheckedIn
      ? '<span class="status-pill good">Checked In</span>'
      : sim.documentCheckedOut
        ? '<button type="button" class="primary-action small" data-target="document-checkin">Check In</button>'
        : '<button type="button" class="primary-action small" data-target="document-checkout">Check Out</button>';
    const reviewStatus = sim.documentReviewInitiated
      ? 'Processing'
      : sim.validationFailed
        ? 'Needs Fix'
        : 'Not Initiated';
    const reviewClass = sim.documentReviewInitiated ? 'info' : sim.validationFailed ? 'warn' : 'neutral';
    const rows = [
      [
        `<button type="button" class="document-chip" data-target="${sim.documentSaved ? 'document-row-new' : 'published-document-row'}">Protocol_CRS2408_Deidentified.pdf<span aria-hidden="true">⇩</span><span aria-hidden="true">⌄</span></button>`,
        'Protocol(s)',
        'DSMB',
        'TRAIN-STUDY-001',
        '',
        'Final',
        '1',
        '02/20/2026',
        '02/20/2026 09:23 AM ET',
        `<span class="status-pill ${reviewClass}" data-target="document-review-status">${escapeHtml(reviewStatus)}</span>`,
        `<button type="button" class="link-button" data-target="document-next-reviewers">NIA PO; DSMB Chair</button>`,
        checkInOutTraining ? checkoutAction : `<button type="button" class="primary-action small" data-target="document-review-action">Initiate Review</button>`
      ],
      [
        '<button type="button" class="document-chip">DSMP_CRS2408_Deidentified.pdf<span aria-hidden="true">⇩</span><span aria-hidden="true">⌄</span></button>',
        'Data and Safety Monitoring Plan (DSMP)',
        'DSMB',
        'TRAIN-STUDY-001',
        '',
        'Final',
        '1',
        '02/20/2026',
        '02/20/2026 09:22 AM ET',
        '<span class="status-pill good">Completed</span>',
        '',
        kebabButton()
      ],
      [
        '<button type="button" class="document-chip">DSMB_Charter_CRS2408.pdf<span aria-hidden="true">⇩</span><span aria-hidden="true">⌄</span></button>',
        'Charter',
        'DSMB',
        'TRAIN-STUDY-001',
        '',
        'Final',
        '1',
        '02/20/2026',
        '02/20/2026 09:22 AM ET',
        '<span class="status-pill good">Completed</span>',
        '',
        kebabButton()
      ]
    ];

    if (sim.documentSaved) {
      rows.unshift([
        '<button type="button" class="document-chip" data-target="document-row-new">Safety_Review_Charter.pdf<span aria-hidden="true">⇩</span><span aria-hidden="true">⌄</span></button>',
        'Charter',
        'DSMB',
        'TRAIN-STUDY-001',
        '',
        'Draft',
        '1',
        '05/06/2026',
        '05/06/2026 02:15 PM ET',
        `<span class="status-pill ${reviewClass}" data-target="document-review-status">${escapeHtml(reviewStatus)}</span>`,
        `<button type="button" class="link-button" data-target="document-next-reviewers">${sim.nextReviewersReviewed ? 'Reviewer list reviewed' : 'NIA PO; DSMB Chair'}</button>`,
        `<button type="button" class="primary-action small" data-target="document-review-action">Initiate Review</button>`
      ]);
    }

    return `
      <div class="detail-subsection">
        ${sectionTableHeader('Documents', '<button type="button" class="inline-action add" data-target="add-document">+ Add Document</button>')}
        ${cromsTable({
          rowsPerPage: '10',
          range: `1-${rows.length} of ${rows.length}`,
          columns: ['Document', 'Document Category', 'Document Tier', 'Study Number', 'Meeting', 'Document Status', 'Version No.', 'Version Date', 'Uploaded Date / Time (ET)', 'Review Status', 'Next Reviewers', 'Actions'],
          rows,
          wide: true
        })}
      </div>
    `;
  }

  function renderCoiDetailsPanel() {
    const sim = state.simulation;
    const rows = [
      ['<button type="button" class="link-button">Dr. Reviewer A</button>', 'Annual', 'TRAIN-STUDY-001', 'Training Study Alpha', 'COI Review Completed', '02/26/2026 01:40 PM ET', 'Serve as DSMB Member', kebabButton()],
      ['<button type="button" class="link-button">Dr. Chair A</button>', 'Annual', 'TRAIN-STUDY-001', 'Training Study Alpha', 'COI Review Completed', '02/18/2026 01:26 PM ET', 'Serve as DSMB Member', kebabButton()],
      ['<button type="button" class="link-button">Dr. Reviewer B</button>', 'Annual', 'TRAIN-STUDY-001', 'Training Study Alpha', 'COI Review Completed', '02/18/2026 01:24 PM ET', 'Serve as DSMB Member', kebabButton()],
      ['<button type="button" class="link-button">Dr. Reviewer C</button>', 'Annual', 'TRAIN-STUDY-001', 'Training Study Alpha', 'COI Review Completed', '02/18/2026 01:20 PM ET', 'Serve as DSMB Member', kebabButton()]
    ];

    if (sim.coiCreated) {
      rows.unshift([
        '<button type="button" class="link-button">Dr. Reviewer A</button>',
        'Ad Hoc',
        'TRAIN-STUDY-001',
        'Training Study Alpha',
        sim.coiSubmitted ? 'COI Submitted' : 'Draft',
        sim.coiSubmitted ? '05/12/2026 02:34 PM ET' : 'N/A',
        'Pending Review',
        kebabButton()
      ]);
    }

    return `
      <div class="detail-subsection">
        ${sectionTableHeader('Conflict of Interest (Current)', '<button type="button" class="inline-action add" data-target="report-coi">+ Report COI</button>')}
        ${cromsTable({
          rowsPerPage: '10',
          range: `1-${Math.min(rows.length, 4)} of ${rows.length}`,
          extras: '<label class="show-all-control"><span class="fake-checkbox"></span> Show All</label>',
          columns: ['Member Name', 'COI Type', 'Study Number', 'Study Title', 'COI Status', 'COI Status Date / Time (ET)', 'COI Review Outcome', 'Actions'],
          rows
        })}
      </div>
    `;
  }

  function renderMemberApprovalPanel() {
    return `
      <div class="detail-subsection">
        ${sectionTableHeader('Members')}
        ${cromsTable({
          rowsPerPage: '10',
          range: '0-0 of 0',
          columns: ['Member Name', 'Study Number', 'Study Title', 'Member Approval Status', 'Member Approval Status Date / Time (ET)', 'Member Approval Review Outcome', 'Member Approval Comments', 'Actions'],
          rows: [],
          emptyColumns: 8
        })}
      </div>
    `;
  }

  function renderEntityModal() {
    const sim = state.simulation;

    return modal('Add Safety Monitoring Oversight Entity', `
      <div class="form-grid">
        ${selectField('entity-type', 'Type', sim.entityTypeSelected ? 'DSMB' : '', 'Select Type', ['DSMB', 'ISM/SO', 'Safety Officer'])}
        ${textField('entity-name', 'Name', sim.entityNameEntered, 'Training DSMB Board 001', 'Enter oversight entity name')}
        ${lookupField('entity-study', 'Associated Study', 'TRAIN-STUDY-001', sim.entityStudySelected ? 'TRAIN-STUDY-001 selected' : '', [
          'TRAIN-STUDY-001 - Training Study Alpha - TRAIN-GRANT-001',
          'TRAIN-STUDY-003 - Training Study Gamma - TRAIN-GRANT-003',
          'TRAIN-STUDY-004 - Training Study Delta - TRAIN-GRANT-004'
        ])}
      </div>
      <div class="modal-actions">
        <button type="button" class="primary-action" data-target="entity-save">Save</button>
      </div>
    `);
  }

  function renderStudyModal() {
    const sim = state.simulation;

    return modal('Add Study', `
      ${lookupField('study-search', 'Study Search', 'TRAIN-STUDY-002', sim.studySelected ? 'TRAIN-STUDY-002 selected' : '', [
        'TRAIN-STUDY-002 - Training Study Beta - TRAIN-GRANT-002',
        'TRAIN-STUDY-001 - Training Study Alpha - TRAIN-GRANT-001',
        'TRAIN-STUDY-003 - Training Study Gamma - TRAIN-GRANT-003'
      ])}
      <div class="modal-actions">
        <button type="button" class="primary-action" data-target="study-save">Save Study</button>
      </div>
    `);
  }

  function renderMemberModal(isAdhoc) {
    const sim = state.simulation;

    if (isAdhoc) {
      return modal('Add Ad Hoc DSMB Member', `
        <div class="form-grid">
          ${lookupField('adhoc-person', 'Person', 'Ad Hoc Reviewer', sim.adhocSelected ? 'Dr. Ad Hoc Reviewer A selected' : '', [
            'Dr. Ad Hoc Reviewer A - External Reviewer',
            'Dr. Reviewer A - Neurology',
            'Dr. Safety Officer A - Safety Officer'
          ])}
          ${lookupField('adhoc-study', 'Study', 'TRAIN-STUDY-001', sim.adhocStudySelected ? 'TRAIN-STUDY-001 selected' : '', [
            'TRAIN-STUDY-001 - Training Study Alpha',
            'TRAIN-STUDY-002 - Training Study Beta',
            'TRAIN-STUDY-003 - Training Study Gamma'
          ])}
        </div>
        <div class="modal-actions">
          <button type="button" class="primary-action" data-target="adhoc-save">Save</button>
        </div>
      `);
    }

    return modal('Add DSMB Member', `
      <div class="form-grid">
        ${lookupField('member-person', 'Person', 'Reviewer A', sim.memberSelected ? 'Dr. Reviewer A selected' : '', [
          'Dr. Reviewer A - Neurology',
          'Dr. Chair A - Geriatrics',
          'Dr. Ad Hoc Reviewer A - External Reviewer'
        ])}
        ${selectField('member-role', 'Role', sim.memberRoleSelected ? 'DSMB Member' : '', 'Select Role', [
          'DSMB Chair',
          'DSMB Member',
          'NIA Program Official',
          'Study Team'
        ])}
      </div>
      <div class="modal-actions">
        <button type="button" class="primary-action" data-target="member-save">Save</button>
      </div>
    `);
  }

  function renderMeetingModal() {
    const sim = state.simulation;
    const written = state.activeTrainingId === 'ismso-written-review';

    return modal('Add Meeting', `
      <div class="form-grid">
        ${selectField('meeting-type', 'Meeting Type', sim.meetingTypeSelected ? 'Safety Review' : '', 'Select Meeting Type', [
          'Administrative',
          'Initial Meeting',
          'Safety Review',
          'Closeout'
        ])}
        ${selectField(written ? 'written-conduct' : 'meeting-conduct', 'Conduct', sim.writtenConductSelected ? 'Written Email Review' : sim.meetingConductSelected ? 'Virtual' : '', 'Select Conduct', [
          'Virtual',
          'In Person',
          'Written Email Review'
        ], true)}
        ${readOnlyField('Start', '06/18/2026 10:00 AM')}
        ${readOnlyField('End', '06/18/2026 12:00 PM')}
      </div>
      <div class="modal-actions">
        <button type="button" class="primary-action" data-target="meeting-save">Save Meeting</button>
      </div>
    `);
  }

  function renderMeetingDetails() {
    const sim = state.simulation;
    const isIsmso = state.activeTrainingId === 'ismso-written-review' || sim.isIsmso;
    const actionButtons = meetingActionButtons();
    const statusHtml = `<button type="button" class="status-pill ${statusClass(sim.meetingStatus)}" data-target="meeting-status">${escapeHtml(sim.meetingStatus)}</button>`;
    const conductExpanded = sim.conductExpanded;
    const infoExpanded = state.activeTrainingId === 'create-meeting';
    const agendaExpanded = sim.agendaExpanded || sim.agendaAdded || state.activeTrainingId === 'workflow-recovery' || state.activeTrainingId === 'run-meeting';
    const participantsExpanded = state.activeTrainingId === 'run-meeting' && sim.conductExpanded;

    return `
      <section>
        ${detailsHeader(isIsmso ? '07/15/2026 09:00 AM - 10:00 AM ET' : '07/15/2026 10:00 AM - 12:00 PM ET', [
          ['DSMB Name', isIsmso ? 'Training ISM/SO Office 001' : 'Training DSMB (Study Alpha; TRAIN-GRANT-001)'],
          ['DSMB Chair', isIsmso ? 'Dr. Safety Officer A' : 'Dr. Chair A'],
          ['PO', 'Dr. Program Officer A'],
          ['Meeting Status', statusHtml]
        ], 'Go To Section', actionButtons, true)}
        <div class="below-sub-header">
          ${detailAccordion('Meeting Conduct Mode', '', 'conduct-panel', conductExpanded, renderMeetingConductMode(isIsmso))}
          ${detailAccordion('Information', '', '', infoExpanded, renderMeetingInformationPanel())}
          ${detailAccordion('Agenda', sim.agendaAdded ? '3' : '0', 'agenda-panel', agendaExpanded, renderAgendaDetailsPanel(isIsmso))}
          ${detailAccordion('Participants', '11', '', participantsExpanded, renderParticipantsPanel())}
          ${detailAccordion('View Meeting Documents', sim.documentSaved ? '1' : '0', 'documents-panel', false, '')}
          ${detailAccordion('Meeting Notifications', sim.emailDraftSaved ? '4' : '0', '', sim.meetingStatus === 'Published' || sim.meetingStatus === 'Completed', renderMeetingNotificationsPanel())}
        </div>
        ${sim.attendanceOpened && !sim.attendanceSaved ? renderAttendanceModal() : ''}
      </section>
    `;
  }

  function meetingActionButtons() {
    const sim = state.simulation;
    const buttons = [];

    if (['Draft', 'Pending Republish'].includes(sim.meetingStatus)) {
      buttons.push('<button type="button" class="primary-action" data-target="draft-email">Draft Email</button>');
    }

    if (sim.meetingStatus === 'Published') {
      buttons.push('<button type="button" class="primary-action" data-target="start-meeting">Start Meeting</button>');
      buttons.push('<button type="button" class="secondary-action">Revise</button>');
      buttons.push('<button type="button" class="secondary-action">Cancel</button>');
    }

    if (sim.meetingStatus === 'In Progress') {
      buttons.push('<button type="button" class="primary-action" data-target="end-meeting">End Meeting</button>');
    }

    return buttons.join('');
  }

  function renderConductBody() {
    return renderMeetingConductMode(false);
  }

  function renderMeetingConductMode(isIsmso) {
    const sim = state.simulation;

    return `
      <p class="required-note">Fields with asterisks (*) are required</p>
      <div class="croms-form-panel">
        ${selectField(isIsmso ? 'written-conduct' : 'meeting-conduct', 'Meeting Conduct Mode *', isIsmso ? 'Written Email Review' : 'Virtual', 'Select Meeting Conduct Mode', [
          'Virtual',
          'In Person',
          'Written Email Review'
        ], true)}
      </div>
      <div class="croms-form-panel">
        <label class="field-label">In Person/Virtual Details *</label>
        <textarea class="readonly-textarea" readonly>${isIsmso ? 'Written review instructions and materials distributed by email.' : 'Secure web conference link and dial-in instructions.'}</textarea>
        <div class="char-counter">CHARACTERS LEFT: ${isIsmso ? '941' : '952'}</div>
      </div>
      <div class="conduct-grid">
        <button type="button" class="metric-card" data-target="attendance-capture">
          <strong>Capture Attendance for Agenda Item</strong>
          <span>${sim.attendanceSaved ? 'Attendance saved' : sim.attendanceOpened ? 'Attendance editor open' : 'Open the attendance modal'}</span>
        </button>
      </div>
      <div class="form-actions nav-actions">
        <button type="button" class="secondary-action">Previous</button>
        <button type="button" class="secondary-action">Next</button>
      </div>
    `;
  }

  function renderMeetingInformationPanel() {
    return `
      <p class="required-note">Fields with asterisks (*) are required</p>
      <div class="croms-form-panel two-column-fields">
        ${readOnlyField('Meeting Start Date/Time *', '07/15/2026, 10:00 AM')}
        ${readOnlyField('Meeting End Date/Time *', '07/15/2026, 12:00 PM')}
      </div>
      <div class="croms-form-panel">
        ${selectField('meeting-type', 'Meeting Type', state.simulation.meetingTypeSelected ? 'Safety Review' : '', 'Select Meeting Type', [
          'Initial Meeting',
          'Safety Review',
          'Bi-Annual Review',
          'Closeout'
        ], true)}
      </div>
      <div class="form-actions nav-actions">
        <button type="button" class="secondary-action">Previous</button>
        <button type="button" class="secondary-action">Next</button>
      </div>
    `;
  }

  function renderAgendaDetailsPanel(isIsmso) {
    const sim = state.simulation;
    const rows = sim.agendaAdded
      ? [
          ['<button type="button" class="link-button" data-target="agenda-row-new">07/15/2026, 10:00 AM ET</button>', 'Open Session', 'Meeting welcome and open-session review', 'Study Specific', 'TRAIN-STUDY-001', 'Dr. Program Officer A', 'Open', 'Bi-Annual Review', agendaActions(5)],
          ['07/15/2026, 10:45 AM ET', 'Closed Session Part I', 'Review closed-session materials and safety data', 'Study Specific', 'TRAIN-STUDY-001', 'Dr. Program Officer A', 'Closed', 'Bi-Annual Review', agendaActions(4)],
          ['07/15/2026, 11:15 AM ET', 'Closed Session Part II', 'Discuss recommendations and action items', 'Study Specific', 'TRAIN-STUDY-001', 'Dr. Program Officer A', 'Closed', 'Bi-Annual Review', agendaActions(0)]
        ]
      : [];

    if (isIsmso && !sim.agendaAdded) {
      rows.push(['07/15/2026, 09:00 AM ET', 'Written Review Materials', 'Review packet and submit written recommendation', 'Study Specific', 'TRAIN-STUDY-001', 'Dr. Program Officer A', 'Written', 'Written Review', agendaActions(0)]);
    }

    return `
      <div class="detail-subsection">
        ${sectionTableHeader('Agenda Items', '<button type="button" class="inline-action add" data-target="add-agenda">+ Add Agenda Item</button>')}
        ${cromsTable({
          rowsPerPage: '10',
          range: rows.length ? `1-${rows.length} of ${rows.length}` : '0-0 of 0',
          columns: ['Date/Time', 'Agenda Title', 'Description', 'Agenda Type', 'Study Number', 'PO Name', 'Session Type', 'Discussion Type', 'Actions'],
          rows,
          emptyColumns: 9
        })}
      </div>
      <div class="form-actions nav-actions">
        <button type="button" class="secondary-action">Previous</button>
        <button type="button" class="secondary-action">Next</button>
      </div>
    `;
  }

  function agendaActions(count) {
    return `
      <div class="agenda-actions">
        <button type="button" class="icon-action" data-target="attendance-capture" aria-label="Capture attendance"><span aria-hidden="true">⇪</span>${count ? `<b>${escapeHtml(count)}</b>` : ''}</button>
        <button type="button" class="icon-action" aria-label="Manage participants"><span aria-hidden="true">♟</span></button>
        <button type="button" class="icon-action" aria-label="Comments"><span aria-hidden="true">●</span></button>
      </div>
    `;
  }

  function renderParticipantsPanel() {
    return `
      <div class="detail-subsection">
        ${sectionTableHeader('DSMB Members')}
        ${cromsTable({
          rowsPerPage: '20',
          range: '1-3 of 3',
          columns: ['Name', 'TRAIN-STUDY-001 - Open Session - Open[Bi-Annual Review]', 'TRAIN-STUDY-001 - Closed Session Part I - Closed[Bi-Annual Review]', 'TRAIN-STUDY-001 - Closed Session Part II - Closed[Bi-Annual Review]', 'Actions'],
          rows: [
            ['Dr. Chair A (DSMB Chair)', toggleSwitch(true), toggleSwitch(true), toggleSwitch(true), kebabButton()],
            ['Dr. Reviewer B', toggleSwitch(true), toggleSwitch(true), toggleSwitch(true), kebabButton()],
            ['Dr. Reviewer C', toggleSwitch(true), toggleSwitch(true), toggleSwitch(false), kebabButton()]
          ]
        })}
      </div>
      <div class="detail-subsection">
        ${sectionTableHeader('Study Team Members')}
        ${cromsTable({
          rowsPerPage: '20',
          range: '1-2 of 2',
          columns: ['Name', 'TRAIN-STUDY-001 - Open Session - Open[Bi-Annual Review]', 'TRAIN-STUDY-001 - Closed Session Part I - Closed[Bi-Annual Review]', 'TRAIN-STUDY-001 - Closed Session Part II - Closed[Bi-Annual Review]'],
          rows: [
            ['Dr. Study PI A (Study PI)', toggleSwitch(true), toggleSwitch(true), toggleSwitch(false)],
            ['Study Coordinator A (Research Coordinator)', toggleSwitch(true), toggleSwitch(false), toggleSwitch(false)]
          ]
        })}
      </div>
    `;
  }

  function renderMeetingNotificationsPanel() {
    return `
      <div class="detail-subsection">
        ${sectionTableHeader('Meeting Notifications')}
        ${cromsTable({
          rowsPerPage: '10',
          range: '1-4 of 4',
          columns: ['Subject', 'To', 'Date Sent', 'Actions'],
          rows: [
            ['Training DSMB Virtual Meeting Notice', 'reviewer-a@example.org; reviewer-b@example.org', '07/10/2026 02:06 PM ET', '<button type="button" class="icon-action">⇩</button>'],
            ['DSMB Meeting Materials Now Available in CROMS', 'member.group@example.org', '07/10/2026 12:39 PM ET', '<button type="button" class="icon-action">⇩</button>'],
            ['DSMB Meeting Materials Now Available in CROMS', 'chair.example@example.org', '07/10/2026 12:33 PM ET', '<button type="button" class="icon-action">⇩</button>'],
            ['DSMB Meeting Materials Now Available in CROMS', 'program.official@example.org', '07/10/2026 12:21 PM ET', '<button type="button" class="icon-action">⇩</button>']
          ]
        })}
      </div>
      <div class="form-actions nav-actions">
        <button type="button" class="secondary-action">Previous</button>
      </div>
    `;
  }

  function renderAttendanceModal() {
    const sim = state.simulation;
    const firstMode = sim.attendanceModeSelected ? 'Remote' : '';

    return `
      <section class="modal-screen embedded-modal">
        <div class="modal-window wide">
          <div class="modal-header">
            <h2>Capture Attendance for Agenda Item</h2>
            <span aria-hidden="true">X</span>
          </div>
          <div class="attendance-list">
            <div class="attendance-heading">
              <strong>Participants</strong>
              <strong>Attendance Mode</strong>
            </div>
            ${attendanceRow('Dr. Chair A', selectField('attendance-mode', 'Attendance Mode', firstMode, 'Select Attendance Mode', ['Remote', 'In Person', 'Absent'], true))}
            ${attendanceRow('Dr. Reviewer B', staticSelect('Remote'))}
            ${attendanceRow('Dr. Reviewer C', staticSelect('Absent'))}
            ${attendanceRow('Dr. Reviewer D', staticSelect('Remote'))}
            ${attendanceRow('Dr. Study PI A', staticSelect('Remote'))}
            ${attendanceRow('Study Coordinator A', staticSelect('Absent'))}
          </div>
          <div class="modal-actions">
            <button type="button" class="secondary-action">Cancel</button>
            <button type="button" class="primary-action" data-target="attendance-save">Save Attendance</button>
          </div>
        </div>
      </section>
    `;
  }

  function attendanceRow(name, controlHtml) {
    return `
      <div class="attendance-row">
        <span class="person-icon" aria-hidden="true">●</span>
        <span>${escapeHtml(name)}</span>
        <div>${controlHtml}</div>
      </div>
    `;
  }

  function staticSelect(value) {
    return `
      <div class="static-select">
        <span>${escapeHtml(value)}</span>
        <span aria-hidden="true">⌄</span>
      </div>
    `;
  }

  function toggleSwitch(on) {
    return `<span class="toggle-switch ${on ? 'on' : ''}" aria-hidden="true"><span></span></span>`;
  }

  function renderAgendaModal() {
    const sim = state.simulation;

    return modal('Add Agenda Item', `
      <div class="form-grid">
        ${selectField('agenda-type', 'Session Type', sim.agendaTypeSelected ? 'Open' : '', 'Select Session Type', [
          'Open',
          'Closed',
          'Executive',
          'Administrative'
        ])}
        ${lookupField('agenda-study', 'Study Context', 'TRAIN-STUDY-001', sim.agendaStudySelected ? 'TRAIN-STUDY-001 selected' : '', [
          'TRAIN-STUDY-001 - Training Study Alpha',
          'TRAIN-STUDY-002 - Training Study Beta',
          'TRAIN-STUDY-003 - Training Study Gamma'
        ], false)}
        ${readOnlyField('Start Time', '10:00 AM')}
        ${readOnlyField('End Time', '10:45 AM')}
      </div>
      <div class="modal-actions">
        <button type="button" class="primary-action" data-target="agenda-save">Save Agenda Item</button>
      </div>
    `);
  }

  function renderEmailModal() {
    const sim = state.simulation;
    const isIsmso = state.activeTrainingId === 'ismso-written-review' || sim.isIsmso;

    return modal(isIsmso ? 'Draft Written Review Email' : 'Draft Meeting Email', `
      <div class="email-preview">
        <button type="button" class="email-row" data-target="email-recipients">
          <span>Recipients</span>
          <strong>${sim.emailRecipientsReviewed ? 'Reviewed' : 'DSMB Members; NIA Staff; Study Team'}</strong>
        </button>
        <div class="email-row">
          <span>Subject</span>
          <strong>${isIsmso ? 'ISM/SO Written Review Materials' : 'Quarterly Safety Review Meeting'}</strong>
        </div>
        ${textAreaControl('email-body', sim.emailBodyReviewed, 'Message reviewed and ready.', 'Enter or revise the meeting message body')}
      </div>
      <div class="modal-actions">
        <button type="button" class="secondary-action" data-target="save-draft">Save Draft</button>
        <button type="button" class="secondary-action" data-target="preview-email">Preview</button>
        <button type="button" class="primary-action" data-target="publish-email">Publish</button>
      </div>
    `, true);
  }

  function renderDocuments() {
    return renderDetails(false, 'documents');
  }

  function renderDocumentModal() {
    const sim = state.simulation;

    return modal('Add Document', `
      <div class="form-grid">
        ${selectField('document-category', 'Document Category', sim.documentCategorySelected ? 'Charter' : '', 'Select Category', [
          'Protocol(s)',
          'Data and Safety Monitoring Plan (DSMP)',
          'Charter',
          'Meeting Materials',
          'COI Documentation',
          'Approval Package'
        ])}
        <div class="upload-zone wide" data-target="document-upload">
          <span class="upload-icon">UP</span>
          <strong>${sim.documentUploaded ? 'Safety Review Charter.pdf' : 'Click to attach document'}</strong>
          <span>${sim.documentUploaded ? 'Ready to save' : 'PDF, DOCX, or XLSX accepted'}</span>
        </div>
      </div>
      <div class="modal-actions">
        <button type="button" class="primary-action" data-target="document-save">Save Document</button>
      </div>
    `);
  }

  function renderWorkflowDialog() {
    return modal('Initiate Document Review Workflow', `
      <button type="button" class="workflow-summary" data-target="workflow-summary">
        <span class="circle-icon good">OK</span>
        <span>
          <strong>Workflow precheck passed</strong>
          <small>Document is checked in, prerequisites are present, and review can proceed.</small>
        </span>
      </button>
      <div class="modal-actions">
        <button type="button" class="primary-action" data-target="workflow-confirm">Confirm</button>
      </div>
    `);
  }

  function renderValidationError() {
    return modal('Workflow Validation', `
      <button type="button" class="validation-message" data-target="validation-message">
        <span class="circle-icon warn">!</span>
        <span>Cannot initiate review until the meeting has at least one agenda item.</span>
      </button>
      <div class="modal-actions">
        <button type="button" class="primary-action" data-target="fix-prereq">Add Missing Agenda</button>
      </div>
    `);
  }

  function renderCoiPanel() {
    return renderDetails(false, 'coi');
  }

  function renderCoiModal() {
    const sim = state.simulation;

    return modal('Report COI', `
      ${lookupField('coi-member', 'Member', 'Reviewer A', sim.coiMemberSelected ? 'Dr. Reviewer A selected' : '', [
        'Dr. Reviewer A - DSMB Member',
        'Dr. Chair A - DSMB Chair',
        'Dr. Ad Hoc Reviewer A - Ad Hoc Reviewer'
      ])}
      <button type="button" class="context-card" data-target="coi-context">
        <strong>Context</strong>
        <span>Training DSMB Board 001 · TRAIN-STUDY-001</span>
        <small>${sim.coiContextReviewed ? 'Reviewed' : 'Click to review before creating COI'}</small>
      </button>
      <div class="modal-actions">
        <button type="button" class="primary-action" data-target="coi-create">Create COI</button>
      </div>
    `);
  }

  function renderCoiForm() {
    const sim = state.simulation;
    const statusHtml = `<button type="button" class="status-pill ${sim.coiSubmitted ? 'good' : sim.coiSaved ? 'info' : 'neutral'}" data-target="coi-status">${sim.coiSubmitted ? 'Submitted' : sim.coiSaved ? 'Draft Saved' : 'In Progress'}</button>`;

    return `
      <section>
        ${detailsHeader('Conflict of Interest Form - Dr. Reviewer A', [
          ['Study Number', 'TRAIN-STUDY-001'],
          ['Study Title', 'Training Study Alpha'],
          ['Grant Number', 'TRAIN-GRANT-001-01'],
          ['Status', statusHtml]
        ], 'Protocol Information', `
          <button type="button" class="secondary-action" data-target="coi-save">Save</button>
          <button type="button" class="primary-action" data-target="coi-submit">Submit</button>
        `, true)}
        <div class="below-sub-header coi-form-body">
          <button type="button" class="coi-info-alert" data-target="coi-form-header">
            <span class="info-dot" aria-hidden="true">i</span>
            <span>${sim.coiHeaderReviewed ? 'Protocol information reviewed. Continue to the conflict sections below.' : 'Review protocol information below, then scroll down to declare potential conflicts and submit the COI form.'}</span>
          </button>
          ${coiDisclosureIntro()}
          ${coiSection('Professional/Personal', '5 of 5', true, `
            <p class="section-help">This section applies to you and close household relationships within the past 3 years unless a different timeframe is noted.</p>
            <div class="coi-question-table">
              <div class="coi-question-head">
                <span>No</span>
                <span>Conflict Types</span>
                <span>Description</span>
                <span>Potential Conflict?</span>
              </div>
              ${coiQuestionRow('1', 'Director, advisor, or decision-maker to organization involved', 'Serving as an officer, member, owner, trustee, director, expert advisor, consultant, or other decision-maker of an organization with a direct role or stake in the study under review.', 'coi-question-1', sim.coiQuestionAnswered)}
              ${coiQuestionRow('2', 'Active collaborator or co-author with PI or key personnel', 'An active collaboration with the principal investigator or key personnel for the study under review.', '', false)}
              ${coiQuestionRow('3', 'Professional relationship', 'A direct supervisory relationship with key study personnel or another relationship that could affect independence.', '', false)}
              ${coiQuestionRow('4', 'Close personal relationship', 'A close personal or outside relationship with study personnel or sponsor representatives.', '', false)}
              ${coiQuestionRow('5', 'Related litigation', 'Involvement in litigation related to the interventions, products, or competing products being reviewed.', '', false)}
            </div>
            ${sim.coiQuestionAnswered ? textAreaControl('coi-question-detail', sim.coiDetailEntered, 'Disclosure detail entered for reviewer evaluation.', 'Enter explanatory detail') : ''}
          `)}
          ${coiSection('Proprietary', '3 of 3', false, '')}
          ${coiSection('Financial', '3 of 3', false, '')}
          ${coiSection('Other', '1 of 1', false, `
            <p class="section-help">If there is anything additional you want to provide, enter it in the textbox below (Optional)</p>
          `)}
        </div>
      </section>
    `;
  }

  function coiDisclosureIntro() {
    return `
      <section class="coi-protocol-card">
        <div class="coi-inline-heading">
          <span class="coi-badge">COI</span>
          <h4>COI Disclosures</h4>
          <span class="green-badge">No Conflicts Reported</span>
        </div>
        <ul>
          <li>Transparency and objectivity are essential in scientific research. Any relationships that could appear to influence objectivity should be disclosed.</li>
          <li>DSMB, ISM, and SO participants should not have direct involvement in the conduct of the study.</li>
          <li><strong>Provide details for all real or perceived conflicts as defined below within the past 3 years, unless a different timeframe is noted.</strong></li>
        </ul>
      </section>
    `;
  }

  function coiSection(title, completed, expanded, body) {
    return `
      <section class="coi-section ${expanded ? 'open' : 'closed'}">
        <div class="coi-section-header">
          <h4>${escapeHtml(title)}</h4>
          <div class="coi-progress">
            <span>100% Completed <em>(${escapeHtml(completed)})</em></span>
            <span class="coi-progress-bar"></span>
          </div>
          <span class="accordion-chevron" aria-hidden="true">${expanded ? '⌄' : '⌃'}</span>
        </div>
        ${expanded ? `<div class="coi-section-body">${body}</div>` : ''}
      </section>
    `;
  }

  function coiQuestionRow(number, type, description, targetId, selected) {
    const radioGroup = targetId
      ? coiRadioGroup(targetId, selected)
      : '<span class="radio-static">○ Yes&nbsp;&nbsp;● No&nbsp;&nbsp;○ Not Specified</span>';

    return `
      <div class="coi-question-row">
        <span>${escapeHtml(number)}</span>
        <strong>${escapeHtml(type)}</strong>
        <span>${escapeHtml(description)}</span>
        <span>${radioGroup}</span>
      </div>
    `;
  }

  function coiRadioGroup(targetId, selected) {
    return `
      <span class="radio-row compact">
        ${radioOption(targetId, 'Yes', selected)}
        ${radioOption(targetId, 'No', selected)}
        <button type="button" class="fake-radio">Not Specified</button>
      </span>
    `;
  }

  function renderEsignature() {
    return modal('E-Signature', `
      <div class="workflow-summary">
        <span class="circle-icon">ID</span>
        <span>
          <strong>Confirm COI submission</strong>
          <small>Signing records the attestation and submits the COI for review.</small>
        </span>
      </div>
      <div class="modal-actions">
        <button type="button" class="primary-action" data-target="esign-confirm">Confirm Signature</button>
      </div>
    `);
  }

  function renderCoiDashboard() {
    const sim = state.simulation;

    return `
      <section>
        ${screenHeader('COI Dashboard', 'Review COI queues and package work.', [
          ['Mode', sim.coiDashboardFiltered ? 'My Tasks' : 'All'],
          ['Submitted', '4'],
          ['Under Review', '2']
        ], '<button type="button" class="primary-action" data-target="coi-filter-my-task">My Tasks</button>')}
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>COI</th>
                <th>Member</th>
                <th>DSMB</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><button type="button" class="link-button" data-target="coi-dashboard-row">COI-1042</button></td>
                <td>Dr. Reviewer A</td>
                <td>DSMB-TRN-001</td>
                <td><span class="status-pill info">Submitted</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    `;
  }

  function renderCoiReview() {
    const sim = state.simulation;

    return `
      <section>
        ${screenHeader('COI Review', 'Reviewer workspace for a submitted COI.', [
          ['COI', 'COI-1042'],
          ['Member', 'Dr. Reviewer A'],
          ['Outcome', sim.coiOutcomeSelected ? 'Approved' : 'Pending']
        ])}
        <button type="button" class="context-card" data-target="coi-review-responses">
          <strong>Response Summary</strong>
          <span>${sim.coiResponsesReviewed ? 'Responses reviewed' : 'Click to review submitted responses and documents'}</span>
        </button>
        ${selectField('coi-review-outcome', 'Review Outcome', sim.coiOutcomeSelected ? 'Approved' : '', 'Select Outcome', [
          'Approved',
          'Request Clarification',
          'Management Plan Required',
          'Not Approved'
        ], true)}
        ${textAreaControl('coi-review-comments', sim.coiReviewComments, 'Reviewer comments entered.', 'Enter review comments')}
        <div class="form-actions">
          <button type="button" class="primary-action" data-target="coi-review-submit">Submit Review</button>
        </div>
      </section>
    `;
  }

  function renderMemberDashboard() {
    const sim = state.simulation;

    return `
      <section>
        ${screenHeader('Member Approval Packages', 'Eligibility review queue for member approval packages.', [
          ['Mode', sim.memberDashboardFiltered ? 'My Tasks' : 'All'],
          ['Under Review', '5'],
          ['Updates Requested', '1']
        ], '<button type="button" class="primary-action" data-target="member-filter-my-task">My Tasks</button>')}
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Package Version</th>
                <th>DSMB</th>
                <th>Status</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><button type="button" class="link-button" data-target="member-package-row">Package Version 3</button></td>
                <td>Training DSMB Board 001</td>
                <td><span class="status-pill warn">Under Review</span></td>
                <td>05/05/2026 10:12 AM</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    `;
  }

  function renderMemberPackage() {
    const sim = state.simulation;

    return `
      <section>
        ${screenHeader('Member Approval Package', 'Eligibility recommendation for DSMB participation.', [
          ['Member', 'Dr. Reviewer A'],
          ['Package Version', '3'],
          ['Status', sim.memberSubmitted ? 'Updated Under Review' : 'Under Review']
        ])}
        ${selectField('member-outcome', 'Eligibility Outcome', sim.memberOutcomeSelected ? 'Eligible to serve as consultant only' : '', 'Select Outcome', [
          'Eligible to serve as member',
          'Eligible to serve as consultant only',
          'Request additional information',
          'Not eligible'
        ], true)}
        ${textAreaControl('member-comments', sim.memberComments, 'Consultant-only eligibility recommended due to disclosed relationship.', 'Enter reviewer comments')}
        <button type="button" class="confirm-row" data-target="member-confirm">
          <span class="checkbox ${sim.memberConfirmed ? 'checked' : ''}"></span>
          <span>I confirm this eligibility recommendation.</span>
        </button>
        <div class="form-actions">
          <button type="button" class="primary-action" data-target="member-submit">Submit Review</button>
        </div>
      </section>
    `;
  }

  function renderCompletion() {
    const training = activeTraining();

    return `
      <section class="completion-card">
        <div class="completion-icon">OK</div>
        <h2>${escapeHtml(training.title)} complete</h2>
        <p>${escapeHtml(training.summary)}</p>
        <div class="completion-actions">
          <button type="button" class="primary-action" data-start-training-id="${escapeHtml(training.id)}">Restart this training</button>
        </div>
      </section>
    `;
  }

  function renderCoachmark(step) {
    if (!state.active || !step) {
      elements.backdrop.hidden = true;
      elements.coachmark.hidden = true;
      return;
    }

    elements.backdrop.hidden = false;
    elements.coachmark.hidden = false;
    elements.coachmark.innerHTML = `
      <div class="coachmark-kicker">Step ${state.stepIndex + 1} of ${activeTraining().steps.length}</div>
      <h2>${escapeHtml(step.title)}</h2>
      <p>${escapeHtml(step.body)}</p>
      <div class="coachmark-action">
        <span>Next action</span>
        <strong>${escapeHtml(actionPrompt(step))}</strong>
      </div>
      <div class="coachmark-success">
        <span class="success-dot" aria-hidden="true"></span>
        <span>${escapeHtml(step.successState)}</span>
      </div>
      <div class="coachmark-controls">
        <button type="button" class="secondary-action small" data-tour-back ${state.stepIndex === 0 ? 'disabled' : ''}>Back</button>
        <button type="button" class="secondary-action small" data-tour-skip>Skip</button>
      </div>
    `;

    measureCoachmarkSoon();
  }

  function measureCoachmarkSoon() {
    window.setTimeout(measureCoachmark, 0);
  }

  function measureCoachmark() {
    if (!state.active || elements.coachmark.hidden) {
      return;
    }

    document.querySelectorAll('.active-target').forEach(target => {
      target.classList.remove('active-target', 'active-click-target');
      target.removeAttribute('data-action-cue');
    });

    const step = currentStep();
    const target = document.querySelector(`[data-target="${step.targetId}"]`);

    if (!target) {
      elements.coachmark.style.top = '96px';
      elements.coachmark.style.left = '24px';
      return;
    }

    target.classList.add('active-target');

    if (step.expectedAction && /^(click|select)\b/i.test(step.expectedAction)) {
      target.classList.add('active-click-target');
      target.setAttribute('data-action-cue', actionCue(step.expectedAction));
    }

    target.scrollIntoView({ block: 'center', inline: 'nearest' });

    window.setTimeout(() => {
      const rect = target.getBoundingClientRect();
      const width = Math.min(390, window.innerWidth - 32);
      const height = Math.min(280, elements.coachmark.offsetHeight || 250);
      const gap = 16;
      const canPlaceBelow = rect.bottom + gap + height < window.innerHeight;
      const top = canPlaceBelow
        ? rect.bottom + gap
        : Math.max(gap, rect.top - height - gap);
      const left = Math.min(
        Math.max(gap, rect.left + rect.width / 2 - width / 2),
        window.innerWidth - width - gap
      );

      elements.coachmark.style.width = `${width}px`;
      elements.coachmark.style.top = `${top}px`;
      elements.coachmark.style.left = `${left}px`;
    }, 0);
  }

  function screenHeader(title, description, meta, actions = '', metaContainsHtml = false) {
    return `
      <div class="screen-header">
        <div class="upper d-flex">
          <div>
            <h3>${escapeHtml(title)}</h3>
            <p class="screen-description">${escapeHtml(description)}</p>
          </div>
          ${actions ? `<div class="screen-actions">${actions}</div>` : ''}
        </div>
        <ul class="h-list bullets">
            ${meta.map(([label, value]) => `
              <li><span>${escapeHtml(label)}</span>${metaContainsHtml ? value : escapeHtml(value)}</li>
            `).join('')}
        </ul>
      </div>
    `;
  }

  function actionCue(expectedAction) {
    return expectedAction.toLowerCase().startsWith('select') ? 'Select here' : 'Click here';
  }

  function detailsHeader(title, meta, selectedSection, actions = '', metaContainsHtml = false) {
    return `
      <div class="screen-header details-page-header">
        <div class="upper d-flex">
          <div>
            <h3>${escapeHtml(title)}</h3>
          </div>
          <div class="screen-actions">
            ${actions}
            <button type="button" class="section-jump-control">
              <span>${escapeHtml(selectedSection || 'Go To Section')}</span>
              <span class="double-caret" aria-hidden="true">⌄</span>
            </button>
            <button type="button" class="kebab-large" aria-label="More actions">⋮</button>
          </div>
        </div>
        <ul class="h-list bullets">
          ${meta.map(([label, value]) => `
            <li><span>${escapeHtml(label)}</span>${metaContainsHtml ? value : escapeHtml(value)}</li>
          `).join('')}
        </ul>
      </div>
    `;
  }

  function detailAccordion(title, count, targetId, expanded, body) {
    const target = targetId ? ` data-target="${escapeHtml(targetId)}"` : '';
    const stateClass = expanded ? 'open' : 'closed';
    const icon = expanded ? '⌄' : '⌃';

    const countText = count === '' || count === null || typeof count === 'undefined'
      ? ''
      : ` (${escapeHtml(count)})`;

    return `
      <section class="detail-accordion ${stateClass}"${expanded ? '' : target}>
        <div class="detail-accordion-header"${expanded && targetId ? target : ''}>
          <h6>${escapeHtml(title)}${countText}</h6>
          <span class="accordion-chevron" aria-hidden="true">${icon}</span>
        </div>
        ${expanded ? `<div class="detail-accordion-body">${body}</div>` : ''}
      </section>
    `;
  }

  function sectionLabel(section) {
    const labels = {
      meetings: 'Meetings',
      members: 'Key Stakeholders',
      studies: 'Studies',
      documents: 'Documents',
      coi: 'Conflict of Interest',
      'member-approval': 'Member Approval'
    };

    return labels[section] || 'Go To Section';
  }

  function sectionTableHeader(title, actions = '') {
    return `
      <div class="section-table-header">
        <h4>${escapeHtml(title)} <span class="history-icon" aria-hidden="true">↻</span></h4>
        ${actions ? `<div class="section-table-actions">${actions}</div>` : ''}
      </div>
    `;
  }

  function cromsTable({ columns, rows, rowsPerPage = '10', range = '1-1 of 1', extras = '', emptyColumns = 1, wide = false }) {
    return `
      <div class="croms-data-table ${wide ? 'wide-table' : ''}">
        <div class="croms-table-toolbar">
          <div class="main-controls">
            <label class="filter-text-control">
              <input type="text" value="" placeholder="Filter Text" readonly>
            </label>
            <button type="button" class="search-button"><span aria-hidden="true">⌕</span> Search</button>
            ${extras}
          </div>
          ${tablePagination(rowsPerPage, range)}
        </div>
        <div class="table-wrap">
          <table class="table list-table">
            <thead>
              <tr>${columns.map((column, index) => `<th>${escapeHtml(column)}${index === 0 ? ' <span aria-hidden="true">↑</span>' : ''}</th>`).join('')}</tr>
            </thead>
            <tbody>
              ${rows.length
                ? rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')
                : `<tr><td colspan="${escapeHtml(emptyColumns)}" class="no-results">There are no results</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function tablePagination(rowsPerPage, range) {
    return `
      <div class="table-pagination">
        <span>Rows Per Page: <strong>${escapeHtml(rowsPerPage)}</strong> <span aria-hidden="true">⌄</span></span>
        <strong>${escapeHtml(range)}</strong>
        <button type="button" aria-label="Previous page">‹</button>
        <button type="button" aria-label="Next page">›</button>
      </div>
    `;
  }

  function kebabButton() {
    return '<button type="button" class="row-kebab" aria-label="Row actions">⋮</button>';
  }

  function dashboardTile(src, alt) {
    return `
      <div class="tile">
        <span title="${escapeHtml(alt)}">
          <img src="${escapeHtml(src)}" width="201" height="200" alt="${escapeHtml(alt)}">
        </span>
      </div>
    `;
  }

  function dashboardTextTile(label, icon) {
    return `
      <div class="tile">
        <span class="sim-dashboard-tile ${escapeHtml(icon)}" title="${escapeHtml(label)}">
          <strong>${escapeHtml(label)}</strong>
          <span aria-hidden="true"></span>
        </span>
      </div>
    `;
  }

  function moduleTile(initials, title, description) {
    return `
      <article class="module-tile">
        <span class="tile-icon">${escapeHtml(initials)}</span>
        <strong>${escapeHtml(title)}</strong>
        <span>${escapeHtml(description)}</span>
      </article>
    `;
  }

  function panelButton(targetId, title, count) {
    const target = targetId ? ` data-target="${escapeHtml(targetId)}"` : '';

    return `
      <section class="collapse-section closed"${target}>
        <div class="collapse-header">
          <h6>
            <span>${escapeHtml(title)} (${escapeHtml(count)})</span>
            <button type="button" class="collapse-toggle" aria-label="${escapeHtml(title)}">+</button>
          </h6>
        </div>
      </section>
    `;
  }

  function modal(title, content, wide = false) {
    return `
      <section class="modal-screen">
        <div class="modal-window ${wide ? 'wide' : ''}">
          <div class="modal-header">
            <h2>${escapeHtml(title)}</h2>
            <span aria-hidden="true">X</span>
          </div>
          ${content}
        </div>
      </section>
    `;
  }

  function fieldButton(targetId, label, value) {
    return `
      <button type="button" class="field-box" data-target="${escapeHtml(targetId)}">
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(value)}</strong>
      </button>
    `;
  }

  function textField(targetId, label, completed, completedValue, placeholder = '') {
    const control = richControls[targetId] || {};
    const active = isCurrentTarget(targetId) && !completed;
    const typedValue = state.formValues[targetId] || '';

    if (active) {
      return `
        <label class="field-box text-entry" data-target="${escapeHtml(targetId)}">
          <span>${escapeHtml(label)}</span>
          <input
            class="croms-input"
            data-text-target="${escapeHtml(targetId)}"
            type="text"
            autocomplete="off"
            value="${escapeHtml(typedValue)}"
            placeholder="${escapeHtml(placeholder || control.value || 'Enter text')}"
          >
        </label>
      `;
    }

    return `
      <div class="field-box">
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(completed ? state.formValues[targetId] || completedValue : placeholder || control.value || 'Enter text')}</strong>
      </div>
    `;
  }

  function textAreaControl(targetId, completed, completedValue, placeholder = 'Enter comments') {
    const control = richControls[targetId] || {};
    const active = isCurrentTarget(targetId) && !completed;
    const typedValue = state.formValues[targetId] || '';
    const maxLength = 6000;
    const charsLeft = Math.max(0, maxLength - typedValue.length);

    if (active) {
      return `
        <label class="comment-box text-entry" data-target="${escapeHtml(targetId)}">
          <span>Free text</span>
          <textarea
            class="croms-textarea"
            data-text-target="${escapeHtml(targetId)}"
            placeholder="${escapeHtml(placeholder || control.value || 'Enter comments')}"
          >${escapeHtml(typedValue)}</textarea>
          <small class="char-counter">CHARACTERS LEFT: ${escapeHtml(charsLeft)}</small>
        </label>
      `;
    }

    return `
      <div class="comment-box">
        <span>${escapeHtml(completed ? state.formValues[targetId] || completedValue : placeholder)}</span>
        <small class="char-counter">CHARACTERS LEFT: ${escapeHtml(maxLength)}</small>
      </div>
    `;
  }

  function selectField(targetId, label, selectedValue, placeholder, options, wide = false) {
    const control = richControls[targetId] || {};
    const active = isCurrentTarget(targetId) && !selectedValue;
    const className = `control-stack ${wide ? 'wide' : ''} ${active ? 'open' : ''}`;

    return `
      <div class="${className}">
        <button type="button" class="field-box select-control" data-control-shell="${escapeHtml(targetId)}" aria-expanded="${active ? 'true' : 'false'}">
          <span>${escapeHtml(label)}</span>
          <strong>${escapeHtml(selectedValue || placeholder)}</strong>
          <span class="select-caret" aria-hidden="true">⌄</span>
        </button>
        ${active ? optionMenu(targetId, options, control.answer) : ''}
      </div>
    `;
  }

  function lookupField(targetId, label, query, selectedValue, options, wide = true) {
    const control = richControls[targetId] || {};
    const active = isCurrentTarget(targetId) && !selectedValue;
    const className = `lookup-control ${wide ? 'wide' : ''} ${active ? 'open' : ''}`;

    return `
      <div class="${className}">
        <label class="lookup-input">
          <span>${escapeHtml(label)}</span>
          <input type="text" value="${escapeHtml(selectedValue || (active ? query : ''))}" placeholder="${escapeHtml(query)}" readonly>
        </label>
        ${active ? optionMenu(targetId, options, control.answer) : ''}
      </div>
    `;
  }

  function searchInput(targetId, completed, completedValue, placeholder) {
    const active = isCurrentTarget(targetId) && !completed;

    if (active) {
      return `
        <label class="croms-search-control active-search" data-target="${escapeHtml(targetId)}">
          <input
            data-text-target="${escapeHtml(targetId)}"
            type="text"
            autocomplete="off"
            value="${escapeHtml(state.formValues[targetId] || '')}"
            placeholder="${escapeHtml(placeholder)}"
          >
        </label>
      `;
    }

    return `
      <div class="croms-search-control">
        <span>${escapeHtml(completed ? completedValue : placeholder)}</span>
      </div>
    `;
  }

  function optionMenu(targetId, options, answer) {
    return `
      <div class="control-menu" role="listbox">
        ${options.map(option => {
          const isAnswer = option === answer;
          const attrs = isAnswer
            ? ` data-target="${escapeHtml(targetId)}" data-control-option="${escapeHtml(option)}"`
            : ` data-control-option-decoy="${escapeHtml(option)}"`;

          return `
            <button type="button" class="control-option ${isAnswer ? 'correct-option' : ''}"${attrs}>
              <span>${escapeHtml(option)}</span>
              ${isAnswer ? '<strong>select</strong>' : ''}
            </button>
          `;
        }).join('')}
      </div>
    `;
  }

  function radioOption(targetId, label, selected) {
    const control = richControls[targetId] || {};
    const isAnswer = label === control.answer;
    const attrs = isAnswer && isCurrentTarget(targetId) && !selected
      ? ` data-target="${escapeHtml(targetId)}" data-control-option="${escapeHtml(label)}"`
      : '';

    return `
      <button type="button" class="fake-radio ${selected && isAnswer ? 'selected' : ''}"${attrs}>
        ${escapeHtml(label)}
      </button>
    `;
  }

  function readOnlyField(label, value) {
    return `
      <div class="field-box readonly">
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(value)}</strong>
      </div>
    `;
  }

  function statusClass(status) {
    if (status === 'Published' || status === 'Completed') {
      return 'good';
    }

    if (status === 'In Progress') {
      return 'info';
    }

    return 'neutral';
  }

  function isCurrentTarget(targetId) {
    return state.active && currentStep()?.targetId === targetId;
  }

  function isProgramOfficerFindTraining() {
    return state.activeTrainingId === 'find-entity-program-officer';
  }

  function isDsmbMemberFindTraining() {
    return state.activeTrainingId === 'find-entity-dsmb-member';
  }

  function textEntryComplete(control, value) {
    const normalized = normalizeText(value);

    if (!normalized) {
      return false;
    }

    if (control.exact) {
      return normalized === normalizeText(control.value);
    }

    return normalized.length >= (control.minLength || 1);
  }

  function actionPrompt(step) {
    const control = richControls[step.targetId];

    if (!control) {
      return step.expectedAction;
    }

    if (control.kind === 'text' && control.exact) {
      return `Type "${control.value}"`;
    }

    if (control.kind === 'textarea') {
      return `Enter free text (${control.minLength || 1}+ characters)`;
    }

    if (['select', 'lookup', 'radio'].includes(control.kind)) {
      return `Select "${control.answer}"`;
    }

    return step.expectedAction;
  }

  function normalizeText(value) {
    return String(value || '')
      .trim()
      .replace(/\s+/g, ' ')
      .toLowerCase();
  }

  function screenLabel(screen) {
    const labels = {
      dashboard: 'Dashboard',
      'dsmb-list': 'DSMB List',
      'ismso-list': 'ISM/SO List',
      details: 'DSMB Details',
      'ismso-details': 'ISM/SO Details',
      'entity-modal': 'Add Safety Monitoring Entity',
      'study-modal': 'Add Study',
      'member-modal': 'Add Member',
      'adhoc-modal': 'Add Ad Hoc Member',
      'meeting-modal': 'Add Meeting',
      'meeting-details': 'Meeting Details',
      'agenda-modal': 'Add Agenda Item',
      'email-modal': 'Draft Email',
      documents: 'Documents',
      'document-modal': 'Add Document',
      'workflow-dialog': 'Workflow Confirmation',
      'validation-error': 'Workflow Validation',
      'coi-panel': 'Conflict of Interest',
      'coi-modal': 'Report COI',
      'coi-form': 'COI Form',
      esignature: 'E-Signature',
      'coi-dashboard': 'COI Dashboard',
      'coi-review': 'COI Review',
      'member-dashboard': 'Member Approval Dashboard',
      'member-package': 'Member Approval Package'
    };

    return labels[screen] || screen;
  }

  function moduleInitials(title) {
    return title
      .split(/[\s/]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0].toUpperCase())
      .join('');
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  document.addEventListener('DOMContentLoaded', init);
})();
