/**
 * The English dictionary, and the source of truth for what keys exist.
 *
 * `TranslationKey` is derived from this object, and th.ts is typed as a
 * complete record of it — so a key added here and forgotten there is a
 * compile error rather than a blank space on screen.
 *
 * Placeholders are `{name}` and are filled by `t(key, params)`.
 */
export const en = {
  // ── chrome ───────────────────────────────────────────────────────────────
  'app.tagline': 'Put the Right Person in the Right Job and Grow the Right Skills',
  'app.principle': 'HRADA analyses, recommends and explains its reasoning — a person always decides',
  'app.headcount': '{count} people',

  'locale.label': 'Language',
  'locale.th': 'ไทย',
  'locale.en': 'English',

  'nav.dashboard': 'Workforce Dashboard',
  'nav.employees': 'Employee Skill Profile',
  'nav.recruit': 'AI Recruit',
  'nav.teamMatching': 'AI Team Matching',
  'nav.learning': 'Personalized Learning',
  'nav.tracking': 'Tracking',
  'nav.insights': 'AI Workforce Insights',

  'role.switch': 'Role',
  'role.choose': 'Choose a role',
  'role.groupOrg': 'Whole organisation',
  'role.groupManager': 'Manager — pick the department you lead',
  'role.groupEmployee': 'Employee — pick who you are',
  'role.hr': 'HR / HR Manager',
  'role.ceo': 'CEO / Business Owner',

  'common.showAll': 'Show all {count} ({hidden} hidden)',
  'common.collapse': 'Collapse',
  'common.viewAll': 'View all',
  'common.none': 'None',
  'common.years': '{count} years',
  'common.months': '{count} months',
  'common.monthsUnit': 'months',
  'common.hours': '{count} h',
  'common.items': '{count} items',
  'common.people': '{count} people',
  'common.peopleUnit': 'people',
  'common.closePanel': 'Close explanation panel',
  'common.of': '{done} of {total}',
  'common.noRecord': 'Nothing recorded yet',
  'common.scopeOrg': 'Scope: the whole organisation',
  'common.scopeTeam': 'Scope: the {department} team only',

  // ── entry ────────────────────────────────────────────────────────────────
  'entry.lede':
    'AI Workforce Intelligence — see what the people you already have are good at, which work fits them, what they are missing, and how they should grow',
  'entry.sample': '({count} of them shown here)',
  'entry.loop.recruit': 'Find the right person',
  'entry.loop.match': 'Fit them to the right work',
  'entry.loop.develop': 'Grow the right skills',
  'entry.loop.track': 'Track the growth',
  'entry.loop.back': 'New data feeds back into RECRUIT',
  'entry.org.title': 'Sign in for the whole organisation',
  'entry.org.hint': 'Sees every department',
  'entry.org.note':
    'HR sees everything including hiring and salary ranges · CEO sees the workforce picture but not candidates or pay',
  'entry.manager.title': 'Sign in as a Manager',
  'entry.manager.hint': 'Sees only the team they lead',
  'entry.employee.title': 'Sign in as an employee',
  'entry.employee.hint': 'Sees only their own skills, their own Skill Gap, their own Learning Path',
  'entry.principle':
    'HRADA is a Decision-Support System — it analyses, recommends and explains, then a person decides. No feature rejects anybody or decides on their behalf, and every number can be opened to show where it came from.',
  'entry.liveNumbers':
    'Every number is computed live — all of it comes from functions in {file}, none of it is written in by hand',

  // ── dashboard ────────────────────────────────────────────────────────────
  'dashboard.liveBadge': 'Every number computed live from scoring.ts',
  'dashboard.kpi.employees': 'Employees',
  'dashboard.kpi.employees.explainOrg': 'How many people are in this sample organisation',
  'dashboard.kpi.employees.explainTeam': 'How many people are in the team you lead',
  'dashboard.kpi.coverage': 'Skill Coverage',
  'dashboard.kpi.coverage.explain':
    'The share of skills that open jobs and active projects need, where at least 2 people meet the level ({covered} of {total} skills)',
  'dashboard.kpi.critical': 'Critical Skill Gaps',
  'dashboard.kpi.critical.explain':
    'Skills with real work waiting on them that nobody in the organisation can do at the level that work needs',
  'dashboard.kpi.highPotential': 'High Potential',
  'dashboard.kpi.highPotential.explain': 'People at 75% Promotion Readiness or above',
  'dashboard.kpi.atRisk': 'At-Risk Skills',
  'dashboard.kpi.atRisk.explain':
    'Skills only one person in the organisation can do at level {bar} — if that person is away, the work stops',
  'dashboard.kpi.mobility': 'Internal Mobility',
  'dashboard.kpi.mobility.explain':
    'The share of people who already meet at least 70% of another role in the organisation',
  'dashboard.constellation.hint':
    'One person = one dot · a line wherever two people share a skill at 3.0 or above · click a dot to open the profile',
  'dashboard.coverage.title': 'Skill Coverage by department',
  'dashboard.coverage.hint': 'The share of skills the work needs that this department can cover',
  'dashboard.insights.title': 'AI Insights',
  'dashboard.insights.hint': 'Built from real data — every one can be opened to show its source',
  'dashboard.insights.empty': 'Nothing to flag within this scope',

  // ── constellation ────────────────────────────────────────────────────────
  'constellation.label': 'Skill Constellation of {count} people',
  'constellation.legend':
    'A line = a shared skill at level {level} or above · dot size = total skill level · orange ring = Workload above {threshold}',

  // ── employees ────────────────────────────────────────────────────────────
  'employees.hint.self': 'You see only your own profile, per the Employee role',
  'employees.hint.team': 'You see only people in the {department} team',
  'employees.hint.all': 'Pick someone to see all of their skills in detail',
  'employees.search': 'Search by name, title or department',
  'employees.empty.title': 'Nobody matches “{query}”',
  'employees.empty.action': 'Try a department name such as Marketing or Data',
  'employees.pick': 'Choose an employee',
  'employees.unclassified': 'Does not meet the criteria for a classification yet',

  // ── profile ──────────────────────────────────────────────────────────────
  'profile.skills.title': 'Skills',
  'profile.skills.hint': 'Click a skill to see the evidence behind its level',
  'profile.skills.noEvidence':
    'No evidence recorded for this level — below 3.0 evidence is not required, but its absence is worth knowing',
  'profile.radar.title': 'Skill profile',
  'profile.radar.hint': 'The dashed line is what {role} requires',
  'profile.radar.current': 'Current level',
  'profile.radar.target': 'Target role',
  'profile.readiness.hint': 'Career goal: {role}',
  'profile.readiness.how': 'How this is worked out',
  'profile.readiness.missing': 'Still missing',
  'profile.readiness.complete': 'Meets every skill the target role requires',
  'profile.readiness.roleNeeds': 'What the target role asks for',
  'profile.readiness.caveat':
    'This number supports a decision, it is not an approval — the call still belongs to the manager and HR',
  'profile.growth.title': 'Skill growth',
  'profile.growth.hint': 'The three main skills over the last 6 months (Mar–Aug 2026)',
  'profile.scale.subtitle': 'What levels 0–5 mean, on the same scale everywhere in the product',
  'profile.denied': 'someone else’s profile is outside what this role can see',

  // ── skill level scale ────────────────────────────────────────────────────
  'scale.level': 'Level',
  'scale.name': 'Name',
  'scale.meaning': 'Meaning',
  'band.None': 'No experience with this skill',
  'band.Aware': 'Understands the concept, needs guidance to perform it',
  'band.Practicing': 'Handles routine work independently, still needs review',
  'band.Proficient': 'Fully independent, can solve unfamiliar problems',
  'band.Advanced': 'Mentors others, designs new ways of working',
  'band.Expert': 'Sets the organisational standard, teaches others',
  'scale.barLabel': '{level} of {max} — {band}',

  // ── recruit ──────────────────────────────────────────────────────────────
  'recruit.hint':
    'Candidates ranked by Match Score with every point explained — the system rejects nobody',
  'recruit.minExperience': 'Minimum experience',
  'recruit.employment': 'Employment',
  'recruit.responsibilities': 'Responsibilities',
  'recruit.required': 'Required',
  'recruit.preferred': 'Preferred',
  'recruit.salary': 'Salary Range',
  'recruit.analysing': 'Analysing {candidates} candidates against the {skills} required skills for {job}',
  'recruit.candidateMeta': '{education} · {years} years of experience · Assessment {score}/100',
  'recruit.criticalWarning':
    'A high total, but short of a critical skill by more than {threshold} levels: {gaps}. This is shown apart from the score on purpose, because an average hides it.',
  'recruit.criticalGapItem': '{skill} {current} against {required} required',
  'recruit.gapBadge': '{skill} short by {gap}',
  'recruit.why': 'Why this match?',
  'recruit.undo': 'Undo this decision',
  'recruit.noAutoReject':
    'Low-scoring candidates stay on the list with their decision buttons — HRADA rejects nobody automatically',
  'recruit.decision.interview': 'Schedule Interview',
  'recruit.decision.interview.done': 'Interview scheduled',
  'recruit.decision.pass': 'Pass to the next round',
  'recruit.decision.pass.done': 'Recorded as passed to the next round',
  'recruit.decision.reject': 'Do not proceed',
  'recruit.decision.reject.done': 'Recorded as not proceeding',
  'recruit.panel.criticalGap': 'Critical gap',
  'recruit.panel.criticalDetail': '{skill}: has {current}, the role needs {required} (short by {gap})',
  'recruit.panel.strengths': 'Strengths that match the role',
  'recruit.panel.noStrengths': 'No required skill is at the bar yet',
  'recruit.panel.gaps': 'Skill Gap',
  'recruit.panel.noGaps': 'Meets every required skill',
  'recruit.panel.background': 'Background',
  'recruit.panel.projects': 'Projects',
  'recruit.panel.caveat':
    'This score is information for HR only. Whether to hire is a human decision.',

  // ── team matching ────────────────────────────────────────────────────────
  'team.hint':
    'Assembled by greedy coverage — whoever closes the most open skills goes first, never a ranking by score',
  'team.projectMeta': 'Needs {size} people · {months} months',
  'team.requiredSkills': 'Required skills',
  'team.covered': 'Covered',
  'team.notCovered': 'Not covered',
  'team.size': 'Team size',
  'team.sizeDown': 'Reduce team size',
  'team.sizeUp': 'Increase team size',
  'team.sizeNote':
    'Change the size and it recomputes at once — a team of 4 or more must include at least one Developing Talent, so the project builds people too',
  'team.steps': 'How the system chose',
  'team.analysing': 'Analysing the Skill Graph of {count} people against {skills} required skills',
  'team.unclassified': 'Unclassified',
  'team.workloadRisk': 'Workload Risk — {name} is already committed at {workload}%',
  'team.workloadBackup': ' If the load has to move, {name} is the best fit to take it',
  'team.why': 'Why this person?',
  'team.gapsTitle': 'This team cannot cover everything',
  'team.gapItem': '{skill}: the strongest person on the team is at {current}, the project needs {required}',
  'team.gapsChoice':
    'Two ways forward — grow someone on the team through a Learning Path, or open a role',
  'team.openRole': 'Open a role for the missing skill',
  'team.viewLearning': 'See Learning Paths for the team',
  'team.complete':
    'This team covers every required skill from people already here — no hiring needed',
  'team.panel.order': 'Why they were picked at this point',
  'team.panel.talent': 'Talent Classification',
  'team.panel.caveat':
    'This is a proposal, not an assignment — the project lead decides how the team is staffed.',

  // ── learning ─────────────────────────────────────────────────────────────
  'learning.hint':
    'Built from each person’s real Skill Gap, not from a generic course recommendation',
  'learning.noEmployees': 'No employee data within this role’s scope',
  'learning.currentSkills': 'Current Skills',
  'learning.highest': 'highest {level}',
  'learning.primaryGap': 'Primary Skill Gap',
  'learning.targetRole': 'Target Role',
  'learning.rolePassed': 'passed {met}/{total} skills',
  'learning.completionRate': 'Skill Completion Rate',
  'learning.completionNote': '{completed}/{assigned} steps done · {started} started',
  'learning.pathTitle': 'Learning Path',
  'learning.pathComplete':
    '{name} meets every skill {role} requires — the next step is a conversation about scope, not another course',
  'learning.markDone': 'Mark {title} as complete',
  'learning.markStarted': 'Mark as started',
  'learning.unmarkStarted': 'Unmark as started',
  'learning.gapTitle': 'Full Skill Gap',
  'learning.gapHint': 'Against {role}',
  'learning.outcomeTitle': 'Learning Outcome',
  'learning.outcomeHint': 'How far completed learning actually moved the level',
  'learning.noHistory': 'No learning history recorded',
  'learning.completedOn': '{skill} · finished {date}',

  // ── tracking ─────────────────────────────────────────────────────────────
  'tracking.hint': 'Skill growth, learning outcomes, performance and career path',
  'tracking.noData': 'No data within this role’s scope',
  'tracking.individual': 'Individual',
  'tracking.team': 'Whole team',
  'tracking.growthTitle': 'Skill Growth',
  'tracking.growthHint': '{name} · last 6 months · growing {rate} levels per month on average',
  'tracking.impactTitle': 'Learning Impact',
  'tracking.impactHint': 'The development metrics from HRADA’s KPI set',
  'tracking.completionNote': '{completed} of {assigned} Learning Path steps done',
  'tracking.engagement': 'Employee Engagement in Development Plan',
  'tracking.engagementNote': '{started} of {assigned} steps started — counting “started”, not “finished”',
  'tracking.timeToCompetency': 'Time to Competency',
  'tracking.notMeasurable': 'Not measurable yet',
  'tracking.notMeasurableNote':
    'No skill’s 6-month history crosses the target role’s bar, so there is no elapsed time to measure',
  'tracking.perSkillMonths': '{skill} {months} months',
  'tracking.managerSatisfaction': 'Manager Satisfaction',
  'tracking.improvement': 'Performance Improvement After Learning',
  'tracking.landed': 'Landed',
  'tracking.notLanded': 'No effect yet',
  'tracking.performanceHint': 'Results, evidence, and what the people around them say',
  'tracking.kpiTotal': 'KPI / overall performance',
  'tracking.projectOutcome': 'Project Outcome',
  'tracking.managerAssessment': 'Manager Assessment',
  'tracking.peerFeedback': 'Peer Feedback',
  'tracking.assessment': 'Assessment',
  'tracking.careerTitle': 'Career Development',
  'tracking.careerHint': 'Goal, readiness, and the options inside the organisation',
  'tracking.careerGoal': 'Career Goal',
  'tracking.gapReduction': 'Skill Gap Reduction',
  'tracking.gapPassed': 'passed {met}/{total}',
  'tracking.roleChanges': 'Role Changes',
  'tracking.roleTenure': '{years} years in the current role, out of {total} years of experience',
  'tracking.mobilityNone': 'Not yet at 70% of any other role',
  'tracking.stillMissing': 'Still missing for the target role',
  'tracking.allMet': 'Everything met',
  'tracking.coverageNote': '{covered} of {total} skills the work needs',
  'tracking.avgReadiness': 'Average Promotion Readiness',
  'tracking.highPotentialNote': '{count} High Potential',
  'tracking.avgCompletion': 'Average Skill Completion Rate',
  'tracking.avgCompletionNote': 'Averaged over every Learning Path within this scope',
  'tracking.mobilityRate': 'Internal Mobility Rate',
  'tracking.mobilityNote': '{count} people meet 70% of another role',
  'tracking.perPerson': 'Per person',
  'tracking.perPersonHint': 'Sorted by Promotion Readiness',
  'tracking.col.name': 'Name',
  'tracking.col.growth': 'Growth / month',
  'tracking.col.completion': 'Skill Completion',
  'tracking.col.engagement': 'Engagement',
  'tracking.col.workload': 'Workload',
  'tracking.col.lowOutcome': 'Learning with no effect',
  'tracking.lowOutcomeCount': '{count} items',

  // ── insights ─────────────────────────────────────────────────────────────
  'insights.hint': 'Every one can be opened to show what it was computed from and which rule produced it',
  'insights.group.critical': 'Fix first',
  'insights.group.critical.hint':
    'Work already committed to, that nobody can deliver at the level required',
  'insights.group.atRisk': 'One person deep',
  'insights.group.atRisk.hint': 'Only one person in the organisation can do this skill at level {bar}',
  'insights.group.atRisk.note':
    'Thinnest bench first — the top entry is the skill where the next-best person is furthest behind its owner',
  'insights.group.workload': 'People carrying too much',
  'insights.group.workload.hint':
    'Workload above 85% and a strong performer — the group most likely to burn out',
  'insights.group.opportunity': 'Opportunities',
  'insights.group.opportunity.hint': 'People growing fast, and people ready for the next role',
  'insights.expandHint': 'Tap to see what it was computed from',
  'insights.computedFrom': 'Computed from',
  'insights.formula': 'Rule used',

  // ── not authorized ───────────────────────────────────────────────────────
  'denied.title': 'You cannot open this page',
  'denied.generic': 'Your current role does not have access to this page',
  'denied.attempted': 'Page attempted: {path}',
  'denied.explain':
    'Access follows the role, so performance and pay data is seen only by the people who need it. To view this page, switch role from the top right.',
  'denied.home': 'Back to this role’s home',
  'denied.pick': 'Choose another role',
  'denial.noRole': 'No role chosen yet — please pick one before continuing',
  'denial.wrongRole': 'This page is open to {allowed} only — your current role is {role}',

  // ── scoring: score component details ─────────────────────────────────────
  'detail.skills': '{list}',
  'detail.noPreferred': 'This role lists no preferred skills',
  'detail.experience': '{years} years against the {required} required',
  'detail.projectRelevance': '{relevant} of {total} projects used a skill this role needs',
  'detail.assessment': 'Assessment score {score}/100',
  'detail.availability': 'Currently committed at {workload}%, {free}% free',
  'detail.performance': 'Latest performance {performance}/5.0',
  'detail.projectHistory': '{relevant} of {total} past projects used a skill this project needs',
  'detail.readinessSkills': 'Meets {met} of the {total} skills {role} requires',
  'detail.tenure': '{years} years in the current role (counted in full at 3 years)',

  // ── scoring: talent classification ───────────────────────────────────────
  'talent.coreExpert':
    '{skill} sits at {level}, backed by {evidence} sources, with performance at {performance}/5.0',
  'talent.bridgeMember':
    'Holds skills at 3.2 or above across {categories} categories, and has worked on {projects} cross-department projects',
  'talent.developing':
    'Still has a gap toward {role} ({skill} short by {gap}), and is growing {growth} levels per month over the last 6 months',
  'talent.unqualified':
    'Does not meet the Core Expert or Bridge Member criteria, and an average growth of {growth} per month is below the {threshold} bar',

  // ── scoring: team selection ──────────────────────────────────────────────
  'team.step.start': 'Starting from {count} required skills with nobody assigned: {list}',
  'team.step.pick': 'Picked {employee} because they close {count} skills: {list}',
  'team.step.exhausted': 'Nobody left in the organisation covers the remaining skills, so coverage stops here',
  'team.step.fill': 'Added {employee} at Fit {fit}% with capacity to spare',
  'team.step.gaps': 'This team is still short on {list} — the choice is to develop someone or open a role',
  'team.reason.cover': 'Closes {count} of the missing skills ({list}) at Fit {fit}%',
  'team.reason.fill': 'Filled from the highest Fit among people with more than 20% capacity left (Fit {fit}%)',
  'team.reason.swap':
    'A team of {size} needs at least one Developing Talent, so they came in for the lowest-Fit member who was not the sole cover for a skill',
  'team.swap.reason':
    'Teams of 4 or more need a Developing Talent so the project builds people too, so {swappedOut} (Fit {fit}%) came out and {swappedIn} went in',

  // ── scoring: learning ────────────────────────────────────────────────────
  'path.method':
    'Ordered easiest to hardest, always closing with real work and a manager reassessment — a skill moves when it is used on real work, not when a course ends',
  'path.rationale': 'Difficulty {difficulty}/3, matching the {gap} levels still missing on {skill}',
  'path.realProject.title': 'Take on real work that requires {skill}',
  'path.realProject.rationale':
    'This step is always required — without real work, the level usually does not move',
  'path.assessment.title': 'Have the manager reassess {skill}',
  'path.assessment.rationale':
    'Closes the loop with fresh evidence, so the recorded level matches the real one',
  'outcome.low':
    'Moved only {delta} levels — this learning has not produced a measurable change yet; consider pairing it with real project work or mentorship',
  'outcome.ok': 'Moved {delta} levels — this learning produced a measurable change',
  'manager.satisfaction.basis':
    'Uses performance of {performance}/5.0 and {reviews} Manager Reviews as a stand-in for Manager Satisfaction — not a survey',

  // ── scoring: insights ────────────────────────────────────────────────────
  'insight.critical.title': 'Nobody can do {skill} at the level the committed work needs',
  'insight.critical.computed':
    '{sources} need level {level}, and of {headcount} people in the organisation nobody reaches it',
  'insight.critical.formula':
    'Critical Skill Gap = a skill an open job or active project needs, with 0 people at the bar',
  'insight.critical.action': 'See open roles',
  'insight.atRisk.title': '{skill} has only one person at level {bar}',
  'insight.atRisk.computed': '{owner} is at {level}, and the next person is {second} at {secondLevel}',
  'insight.atRisk.computedAlone': '{owner} is at {level}, and nobody else in the organisation can do this skill at all',
  'insight.atRisk.formula': 'At-Risk Skill = a skill with exactly 1 person at level {bar}',
  'insight.atRisk.action': 'Build a Learning Path for a second person',
  'insight.workload.title': '{employee} is committed at {workload}% and is a strong performer',
  'insight.workload.computed':
    'Workload {workload}% (above 85%) with performance {performance}/5.0 (4.0 or above)',
  'insight.workload.formula': 'Workload Risk = workload above 85% and performance of 4.0 or more',
  'insight.workload.action': 'Redistribute through Team Matching',
  'insight.growth.title': '{employee} is growing faster than the organisation average',
  'insight.growth.computed':
    '6 months of skillHistory (Mar–Aug 2026) growing {growth} levels per month on average, above the {threshold} bar',
  'insight.growth.formula':
    'Growth Opportunity = a Developing Talent growing at 0.15 levels per month or more',
  'insight.growth.action': 'See the Learning Path',
  'insight.promotion.title': '{employee} is at {percent}% Promotion Readiness for {role}',
  'insight.promotion.formula':
    'Promotion Readiness = (skills met × 0.7) + (performance/5 × 0.2) + (min(years in role/3, 1) × 0.1)',
  'insight.promotion.action': 'Open the profile',

  'source.job': 'Open role: {name}',
  'source.project': 'Project: {name}',

  // ── insight kind labels (HR terminology, English in both locales) ────────
  'kind.critical-skill-gap': 'Critical Skill Gap',
  'kind.at-risk-skill': 'At-Risk Skill',
  'kind.workload-risk': 'Workload Risk',
  'kind.growth-opportunity': 'Growth Opportunity',
} as const

export type TranslationKey = keyof typeof en
