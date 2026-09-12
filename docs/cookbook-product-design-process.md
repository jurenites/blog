# From Product Purpose to Pixels: My Product Design and Development Cookbook

> Working article draft · Alexander Ilivanov · September 10, 2026
>
> This article will evolve through revisions, practical examples, images, links, and embedded previews. The examples below are illustrative; they do not describe a completed client project.

Building software means working at several levels of detail. At one moment, I am asking what the product stands for, who needs it, and what it should help them accomplish. At another, I am adjusting the spacing around a button or checking how a long title wraps on a small screen.

Both belong to the same process. A polished interface needs a clear purpose behind it, and that purpose eventually has to survive contact with real forms, data, permissions, and interactions.

This cookbook describes how I move between those levels. I have organized it into twelve milestones, each leaving something concrete that the next decision can build on. The sequence gives me a starting point, while the work itself involves repeated passes. Customer feedback, QA findings, technical constraints, management decisions, my own ideas, and AI-generated implementations can all reveal something that needs another look.

Before the first milestone, I capture the initial idea in the task conversation: what problem I believe exists, who experiences it, and what a useful outcome would look like. It can be rough. Its purpose is to give the project a direction that we can question and refine. I keep durable decisions and deferred ideas in the relevant project documentation.

## 1. Identify the people, roles, and permissions

My first step is to understand who will interact with the product and how those people relate to one another.

A public website might serve only anonymous visitors. A SaaS product might involve customers, support staff, and the business providing the service. Another application might distinguish regular users, managers, and administrators.

I write down what each role needs to accomplish, which information it can see, and which actions it can perform. The relationship matters as much as the role name. A customer might edit their own request, while a support agent can work with requests assigned to their team.

This makes permissions part of the product conversation from the beginning. A visible button represents an action someone should be allowed to perform; the eventual application must enforce that permission too.

**Milestone:** a role map and an initial permission matrix connecting roles, information, and actions.

## 2. Collect the nouns and verbs

Next, I collect the things the product deals with and the actions people take on them.

Nouns might include a customer, organization, request, comment, attachment, or subscription. Verbs might include create, assign, reply, approve, publish, archive, or cancel.

The nouns are candidates for entities, fields, or other concepts in the product model. At this stage, I keep their arrangement flexible. Several concepts may belong in one record; others may eventually need their own records and relationships. Database normalization comes later.

The verbs suggest workflows and interface controls. “Assign a request” raises useful questions immediately: who can assign it, to whom, and under which conditions? Some actions will become buttons or menu items; others may happen automatically in the background.

**Milestone:** an inventory of product concepts and actions, connected to the roles that use them.

## 3. Explore the interface in grayscale

With the initial roles and concepts in place, I make grayscale wireframes and simple prototypes.

I want to understand what each screen needs to display, which information deserves attention, and how someone moves through a task. A request list may need a status, an owner, and a short summary. The detail screen may need the conversation, attachments, and available actions.

I use plausible content early, including long names and empty lists. These reveal layout and workflow problems that short placeholder text can hide. Where an interaction is uncertain, a small clickable prototype helps make it discussable.

**Milestone:** a set of rough screens and flows showing the required information and controls.

## 4. Define the forms and relationships

As the screens become clearer, the forms for creating and editing records start to take shape.

This is where I examine fields more closely: which are required, which hold long text, which allow multiple values, and which should reference another record. A field also needs a clear meaning, an appropriate control, and understandable validation.

Forms often expose relationships. A request may belong to one customer, have an optional assigned agent, and contain many comments. Drawing an entity–relationship diagram helps us discuss those connections and their cardinality: one-to-one, one-to-many, or many-to-many.

I treat this as an initial data model. Backend developers can refine its normalization and storage structure as business rules, framework conventions, and technical requirements become clearer. A visible form does not have to correspond directly to a single database table.

**Milestone:** draft entity forms, field definitions, and an initial ER diagram.

## 5. Establish a shared glossary

By this point, we have enough vocabulary to notice where language is becoming inconsistent.

Does “customer” mean a person or an organization? Are “request,” “ticket,” and “case” the same thing in this product? What distinguishes “closed” from “resolved”?

I turn those questions into a glossary of key terms, definitions, and examples. This gives designers, developers, QA, stakeholders, and AI assistants a shared reference. The same vocabulary should appear in conversations, interface copy, documentation, and code where practical.

The glossary starts with the nouns and verbs collected earlier and continues to change as our understanding improves.

**Milestone:** an agreed vocabulary that reduces ambiguity across the product and team.

## 6. Create the first design tokens

Now I begin recording reusable visual decisions in a token file.

The first tokens cover values the emerging interface actually needs: colors, typography, spacing, borders, corners, and other recurring properties. I choose names that communicate their purpose so the team can understand where each value belongs.

In this website's workflow, the editable token source is `src/token/tokens.yaml`. It provides a concrete place to revise shared visual decisions as the design develops.

Tokens begin small. New needs discovered while designing components may require new tokens or better names for existing ones.

**Milestone:** a first set of named visual values that can be reused consistently.

## 7. Build the Figma design system

I use the emerging visual language to define the components and guidelines the product needs in Figma.

The grayscale screens give this work a practical scope. If the product requires text inputs, buttons, status indicators, and record cards, those are the components I develop first. I define their useful variants and states, including focus, disabled, loading, and error states where relevant.

The guidelines explain how to use those pieces: hierarchy, spacing, typography, contrast, and interaction patterns. Designing a component also feeds back into the token file when a shared value is missing or unclear.

This is where visual refinement becomes increasingly precise, while real content and user tasks continue to guide it.

**Milestone:** a focused Figma component library with the foundations and usage rules needed for the current product.

## 8. Build and inspect components in Storybook

The design now becomes working interface code. I use Storybook to inspect components in the browser, with examples of their states and content variations. Storybook supports this development in isolation from the full application. [Storybook documentation](https://storybook.js.org/docs/get-started/why-storybook)

I think of this as building the interface in small, reusable pieces. Atomic Design gives me a vocabulary for that composition: atoms combine into molecules and organisms, which participate in templates and complete pages. These levels help me move between a component and its context. [Brad Frost's Atomic Design methodology](https://atomicdesign.bradfrost.com/chapter-2/)

A button may look correct by itself but need adjustment when placed inside a crowded form. I move between those views to check whether the parts work together.

I also establish linting, formatting, naming conventions, and useful code-quality checks here. In my workflow, those checks keep recurring implementation details consistent while I focus on behavior and presentation.

**Milestone:** working UI components with inspectable examples, reusable composition, and basic code-quality checks.

## 9. Consolidate the documentation

The previous milestones have already produced documentation: permissions, terminology, fields, tokens, and component rules. Here I make that material easier to navigate and maintain.

Markdown in the repository or a shared space such as Confluence can hold the product explanation, setup instructions, decisions, limitations, and links to supporting artifacts. I want a teammate to understand both the expected behavior and the reason for a significant decision.

Documentation should describe what we currently intend and what we have actually implemented. When those differ, the difference needs to be visible.

**Milestone:** a connected reference that helps someone understand, build, review, and maintain the product.

## 10. Shape the backlog into epics and deliverable work

I organize the remaining work around product outcomes.

An epic might be “Customers can manage their support requests.” Smaller items can cover submitting a request, viewing its status, adding information, and receiving a response. Each item needs enough context to identify the relevant role, expected behavior, and acceptance criteria.

I also connect work items to the designs, forms, permissions, and technical dependencies they involve. This makes the backlog useful for implementation and review.

A rough backlog may exist much earlier. At this milestone, it becomes specific enough to guide delivery.

**Milestone:** prioritized epics and smaller work items with clear outcomes and acceptance criteria.

## 11. Assemble the working application

Now the interface components become part of the application, connected to real data and behavior.

This work includes routing, storage, validation, authentication where needed, permission enforcement, and the services that support each workflow. I prefer to assemble a small complete path early, such as creating a request and seeing the saved result, so we can evaluate how the pieces behave together.

Integration brings new information. Real content may challenge a layout. A framework may suggest a different storage arrangement. A permission rule may require another state in the interface. I carry those findings back into the relevant design, model, or documentation.

**Milestone:** a working application flow that connects the intended experience to real implementation behavior.

## 12. Verify the result against the expectation

Finally, I make the connection between what we planned and what we can demonstrate.

A feature needs a clear expectation and a way to check it. That evidence may come from a QA engineer following a manual test, an automated test run through CI/CD, a visual review, or a combination of methods.

For example: “A customer can view their own requests and cannot access another customer's request.” A meaningful check covers both the allowed path and the denied path.

I like the idea of a green indicator beside a feature, provided we can see what it means: the criterion checked, the method, the result, and the build or date it applies to. “Passed,” “failed,” “not checked,” and “blocked” communicate more than a single undifferentiated checkmark. A passing pipeline only establishes what its checks cover.

Although verification is the final milestone in this description, I define expectations and run useful checks throughout the work.

**Milestone:** visible evidence connecting requirements to the behavior of the implementation.

### Proposed testing layer: Figma, Storybook, and Drupal

I am considering a visual testing layer that brings three views together: the matching Figma frame, the isolated Storybook component, and the Drupal theme rendered with real content. A review page would show them in labeled iframes with direct links, making it easier to compare a design decision with both implementations. A first local component-status dashboard now lists Storybook components, records rendering checks, and compares Storybook with Drupal screenshots using real content. It shows source links and individual results. Figma pixel comparison and automatic CI report ingestion are still pending.

For each comparison I would use the same text, media, language, viewport, and component state. The Drupal view would use selected real entities and recorded content revisions; Storybook fixtures and the Figma reference would carry the matching values. A separate review against current live content would help expose long titles, optional fields, and other editorial variations.

The iframe views support interactive review. Automated pixel checks would compare an exported Figma frame with controlled browser screenshots of the equivalent component or page region. I would also compare the Storybook component with its Drupal rendering. Equal capture bounds, loaded fonts and images, a stable browser environment, and reproducible states are necessary; resizing a screenshot to hide a geometry mismatch would defeat the check.

Pixel-perfect layout is the goal, with narrowly documented tolerances only where observed rendering differences justify them. A report should show the reference, actual capture, visual difference, content revision, and build identity, and distinguish passed, failed, not checked, and blocked. Functional and accessibility checks remain part of verification. Feedback from any mismatch returns to the affected design, token, component, data, or theme decision.

Technical references: [Figma file embeds](https://developers.figma.com/docs/embeds/embed-figma-file/), [Figma frame exports](https://developers.figma.com/docs/rest-api/file-endpoints/#get-images-endpoint), and [Playwright visual comparisons](https://playwright.dev/docs/test-snapshots).

The implementation proposal lives in [Visual Testing Plan](visual-testing-plan.md).

## When an AI agent builds the first version

The route can change when I start by asking an AI agent to build a working prototype. Around the component stage—or even earlier—code may appear before the design library, documentation, and data model are fully developed.

That implementation gives me something concrete to explore. It can also contain assumptions about terminology, permissions, data, or behavior that I never explicitly chose.

I review those assumptions against the intended product. If the implementation reveals a useful idea, I decide whether to adopt it and update the affected artifacts. If it conflicts with an agreed requirement, I correct the implementation and verify the result.

This creates a path back from code to design and documentation. The requirement, interface, implementation, and test should describe the same decision, regardless of where the first proposal came from.

## How the iteration loop works

A new idea or finding can enter at any milestone. I first record what prompted it and which expectation it affects. Then I revisit the earliest decision that needs to change, carry the change through its dependencies, and verify the resulting behavior.

The practical loop is:

1. **Observe:** capture a request, problem, constraint, or unexpected result.
2. **Decide:** clarify the intended outcome and agree on the change.
3. **Revise:** update the affected roles, concepts, flows, forms, language, or visual rules.
4. **Implement:** bring the components and application into agreement with that decision.
5. **Verify:** check the result and record the evidence.

Different sources can send us to different starting points:

| Source | Illustrative finding | Decisions to revisit |
| --- | --- | --- |
| Customer or commissioning client | “Our team needs to share responsibility for a request.” | Roles, ownership, relationships, and workflows |
| QA engineer | A user can access someone else's private record. | Permission enforcement and coverage of the existing requirement |
| Developer | The proposed relationship is awkward in the chosen framework. | Data model and implementation approach, while preserving required behavior |
| Management | The first release needs a different business priority. | Product scope, priorities, and acceptance criteria |
| My own design exploration | People miss the main action. | Information hierarchy, copy, layout, and components |
| AI-generated implementation | The prototype introduces an unrequested approval step. | Whether to adopt that proposal or correct the implementation |

For a concrete example, imagine that QA discovers a customer can see another customer's attachment. I return to the permission rule and compare it with the implementation. If the rule was already correct, I fix enforcement and add a focused check. If the intended sharing behavior was unclear, we first clarify it, then update the affected interface, documentation, code, and tests.

The loop is as small or as broad as the finding requires. A spacing adjustment may affect one token or component. A new ownership model may reach all the way back to roles and relationships.

The purpose of this cookbook is to keep those connections visible as the product evolves—from the reason it exists to the smallest details someone interacts with.

---

## Editorial notes for future revisions

This section is a working brief for developing the article further.

### Main process visual

Use a path of twelve numbered milestones grouped into four levels of detail:

- **Understand the product:** roles; nouns and verbs.
- **Shape the experience and model:** grayscale prototypes; forms and relationships; glossary.
- **Build the visual language:** tokens; Figma; Storybook.
- **Deliver and learn:** documentation; backlog; application; verification.

Place a return path beneath the milestones. Feedback enters through labeled sources—customer, QA, development, management, personal ideas, and AI output—and travels back to the affected milestone. Keep the product purpose visible above the whole path. Use labels and arrow direction so the meaning remains clear without color.

A single circular arrow from step 12 to step 1 would hide the smaller loops. The visual should show that feedback can arrive during any stage and that a change can return to step 4 or step 7 without restarting the whole project.

For an eventual interactive version, selecting a feedback source could highlight one example route and the artifacts revised along it. A static version can show one highlighted example while keeping the complete milestone path visible.

### Images and embedded examples to add

| Article location | Proposed material | What it should explain |
| --- | --- | --- |
| Opening | Product-purpose view beside a close-up of one UI detail | The different scales of product work |
| Milestones 1–2 | Role matrix and a noun/verb inventory | How people, concepts, and actions connect |
| Milestones 3–4 | Grayscale form beside an ER diagram | How interface exploration informs the data model |
| Milestones 6–8 | One token, its Figma component, and its browser result | How a shared visual decision reaches implementation |
| Milestone 8 | Embedded Storybook example with useful states | How a component behaves under different conditions |
| Milestone 12 | Feature verification table plus proposed Figma, Storybook, and Drupal iframe views and screenshot diffs | What each check establishes for the same content and state |
| Iteration section | Feedback path through selected milestones | How one finding changes several connected artifacts |

Keep one running example across these additions so readers can follow the same role, record, action, component, and test through the process. Replace the illustrative support-request example with a documented project example when suitable material is available.

Add captions and useful alternative text with each image. Future iframe previews should have descriptive titles and a direct link to open the example separately; confirm the target publishing environment supports the embed before adding it.

For substantive revisions, leave a short editorial note explaining what changed and why. Keep examples of intended behavior distinct from evidence of behavior verified in an actual build.

Editorial revision · September 11, 2026: aligned the workflow summary with the twelve milestones and added the proposed Figma, Storybook, and Drupal visual testing layer.
