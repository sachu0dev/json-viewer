# Devure JSON — Best-in-Class Product & Engineering Master Plan

## 0. Product Vision

Build Devure JSON into the **best privacy-first JSON developer workspace on the web**.

This should not feel like a basic:

> "Paste JSON → click Format"

tool.

It should feel like a polished developer application that a developer can bookmark and use every day for:

* Formatting
* Validation
* Debugging
* Viewing
* Searching
* Comparing
* Transforming
* Converting
* Querying
* Generating code
* Inspecting API responses
* Working with large JSON files
* Sharing JSON safely
* Working offline

### Core positioning

> **The fastest, most powerful and privacy-first JSON toolkit for developers.**

### Product principles

1. **Privacy first**
2. **Local-first processing**
3. **Instant interaction**
4. **Excellent keyboard UX**
5. **Beautiful but developer-focused UI**
6. **No unnecessary account requirement**
7. **Works with huge JSON files**
8. **Every feature should be composable**
9. **Accessible**
10. **Mobile-friendly**
11. **Offline-capable where possible**
12. **No feature should make the core editor feel bloated**

---

# 1. PRODUCT INFORMATION ARCHITECTURE

The application should eventually have:

```text
Devure JSON
│
├── JSON Viewer
├── JSON Formatter
├── JSON Validator
├── JSON Beautifier
├── JSON Minifier
├── JSON Diff
├── JSONPath
├── JSON Schema
├── JSON Repair
│
├── Converters
│   ├── JSON → TypeScript
│   ├── JSON → JavaScript
│   ├── JSON → Python
│   ├── JSON → Java
│   ├── JSON → Go
│   ├── JSON → Rust
│   ├── JSON → C#
│   ├── JSON → Kotlin
│   ├── JSON → Swift
│   ├── JSON → CSV
│   ├── JSON → YAML
│   ├── JSON → XML
│   └── JSON → TOML
│
├── Encoders / Decoders
│   ├── Base64
│   ├── JWT
│   └── URL encoding
│
├── Developer Utilities
│   ├── API response inspector
│   ├── JSONPath tester
│   ├── JSON Schema tester
│   └── HTTP response viewer
│
└── Settings
    ├── Appearance
    ├── Editor
    ├── Formatting
    ├── Keyboard shortcuts
    ├── Privacy
    └── Performance
```

Do NOT expose every feature simultaneously in the main UI.

The main experience should remain:

**Input → Inspect → Work → Export**

---

# 2. CORE EDITOR

The editor is the heart of the product.

## 2.1 Input modes

Support:

* Paste JSON
* Drag and drop file
* File picker
* Load from local file
* Paste from clipboard
* Import text
* Import URL optionally
* Drop multiple files for future batch operations

## 2.2 Editor capabilities

Implement:

* Syntax highlighting
* Line numbers
* Current line highlighting
* Bracket matching
* Auto indentation
* Auto closing brackets
* JSON syntax awareness
* Error highlighting
* Selection highlighting
* Find
* Find and replace
* Replace all
* Word/key search
* Case-sensitive search
* Regex search
* Match count
* Jump to line
* Go to error
* Copy
* Cut
* Paste
* Select all
* Undo
* Redo

## 2.3 Editor modes

Support:

```text
Raw
Tree
Split
Preview
```

### Raw

Traditional JSON editor.

### Tree

Interactive hierarchical viewer.

### Split

Editor on one side and tree on the other.

### Preview

Clean read-only presentation.

---

# 3. TREE VIEWER

The tree viewer should be one of the strongest parts of the application.

Support:

* Expand
* Collapse
* Expand one level
* Collapse one level
* Expand all
* Collapse all
* Expand selected
* Collapse selected
* Search
* Highlight matches
* Copy value
* Copy key
* Copy path
* Copy JSON
* Copy subtree
* Download subtree
* Delete node
* Rename key
* Edit value
* Add property
* Add array item
* Duplicate node
* Move node
* Drag-and-drop nodes
* Sort keys
* Show data types

Example:

```text
users
 ├── 0
 │   ├── id
 │   ├── name
 │   ├── email
 │   └── roles
 │       ├── 0
 │       └── 1
 └── 1
```

Clicking any node should provide:

```text
Copy Value
Copy Key
Copy Path
Copy JSON
Edit
Delete
```

---

# 4. JSON VALIDATOR

Validation must be excellent.

Display:

* Valid JSON
* Invalid JSON
* Error location
* Line
* Column
* Character position
* Error type
* Human-readable explanation
* Suggested fix

Example:

```text
Invalid JSON

Line 8
Column 14

Trailing comma detected.

JSON objects and arrays cannot contain trailing commas.

[Fix automatically]
```

Support common error categories:

* Missing comma
* Extra comma
* Missing quote
* Unclosed object
* Unclosed array
* Invalid string
* Invalid escape
* Invalid number
* Unexpected token
* Invalid literal
* Duplicate key warning
* Invalid Unicode
* BOM issues

---

# 5. JSON AUTO-REPAIR

Add an explicit:

**Repair JSON**

feature.

The system should:

1. Detect errors
2. Explain errors
3. Preview changes
4. Allow user approval
5. Apply changes
6. Show before/after

Never silently mutate user data.

Provide:

```text
Original
Changes
Fixed JSON
```

---

# 6. FORMATTER / BEAUTIFIER

Formatting controls:

* Indentation

  * 2 spaces
  * 4 spaces
  * tabs
  * custom
* Sort keys
* Keep key order
* Compact arrays
* Preserve arrays
* Trailing newline
* Quote formatting where applicable
* Line wrapping
* Maximum line width

Buttons:

```text
Format
Format & Copy
Format & Download
```

Keyboard shortcut:

```text
Ctrl/Cmd + Shift + F
```

---

# 7. MINIFIER

Support:

* Minify JSON
* Copy minified JSON
* Download minified JSON
* Show original size
* Show minified size
* Show percentage reduction

Example:

```text
Original: 2.4 MB
Minified: 1.8 MB
Saved: 25%
```

---

# 8. JSON DIFF

Build a serious JSON comparison tool.

Current site already exposes a Diff mode, so this should become a major product area.

Support:

* Compare two JSON documents
* Paste A
* Paste B
* Upload A
* Upload B
* Tree diff
* Text diff
* Added values
* Removed values
* Changed values
* Moved values
* Type changes
* Array changes
* Nested changes

Example:

```text
users[2].name

OLD:
"John"

NEW:
"Jonathan"
```

Filters:

```text
All
Added
Removed
Changed
Unchanged
```

Actions:

* Copy diff
* Download diff
* Export report
* Collapse unchanged
* Expand changed
* Navigate next change
* Navigate previous change

---

# 9. JSONPATH TOOL

Build a dedicated JSONPath playground.

Layout:

```text
JSON
        ↓
JSONPath query
        ↓
Results
```

Example:

```text
$.users[*].email
```

Show:

* Matching nodes
* Result count
* Paths
* Values
* Execution time

Include:

**JSONPath Examples**

with common queries.

---

# 10. JSON SCHEMA TOOL

Create a JSON Schema playground.

Support:

* Input JSON
* Input schema
* Validate
* Error tree
* Path to error
* Expected type
* Actual type

Show:

```text
/users/0/email

Expected:
string

Received:
number
```

Support common JSON Schema versions where practical.

---

# 11. JSON → TYPESCRIPT

This should be a flagship feature.

Input:

```json
{
  "name": "Sushil",
  "age": 23,
  "skills": ["React", "Node"]
}
```

Output:

```ts
interface Root {
  name: string;
  age: number;
  skills: string[];
}
```

Controls:

* Interface
* Type
* Optional properties
* Nullable properties
* Naming strategy
* Root type name
* Export keyword
* readonly
* Generate nested interfaces
* Generate enums where possible

---

# 12. CODE GENERATORS

Add generators for:

* TypeScript
* JavaScript
* Python
* Java
* Kotlin
* Go
* Rust
* C#
* Swift
* PHP

Each generator should have language-specific options.

Example:

TypeScript:

```text
interface
type
zod
```

Python:

```text
TypedDict
dataclass
Pydantic
```

Rust:

```text
struct
serde
```

Go:

```text
struct
json tags
```

---

# 13. FORMAT CONVERTERS

Support:

### JSON → CSV

Controls:

* Flatten nested data
* Array handling
* Headers
* Nested path notation

### JSON ↔ YAML

### JSON ↔ XML

### JSON → TOML

Only add formats when the conversion is reliable.

Never claim conversion support if edge cases are not handled correctly.

---

# 14. JWT DECODER

Create a JWT inspection tool.

Show:

```text
Header
Payload
Signature
```

Decode:

* Base64URL
* Claims
* Expiration
* Issued-at
* Issuer
* Subject
* Audience

Highlight:

```text
Expired
Valid
Expires in 2h
```

VERY IMPORTANT:

Clearly state:

> Decoding a JWT does not verify its signature.

Never send JWTs to the backend.

---

# 15. SEARCH

Global JSON search.

Support:

* Search keys
* Search values
* Search paths
* Case-sensitive
* Case-insensitive
* Regex
* Exact match
* Partial match

Results:

```text
12 matches

users[2].email
users[7].email
users[10].email
```

Clicking a result should jump directly to the node.

---

# 16. JSON PATH COPY

Every node should have:

```text
Copy path
```

Examples:

```text
$.users[0].name
```

or:

```text
users.0.name
```

Allow path format selection.

---

# 17. LARGE FILE ENGINE

This is critical.

The existing product already advertises multi-MB JSON without freezing the browser.

Turn this into a major differentiator.

Support:

* 10 MB
* 50 MB
* 100 MB
* Larger files where browser resources permit

Do NOT load massive files naively into React state.

Architecture should consider:

* Web Workers
* Streaming parsing where possible
* Incremental processing
* Virtualized tree
* Virtualized text editor
* Lazy node expansion
* Memory-conscious data structures
* Background parsing
* Progress indicators
* Cancellation

UI:

```text
Parsing...

37%

[Cancel]
```

For extremely large files:

```text
Large file mode enabled
```

---

# 18. PERFORMANCE ARCHITECTURE

The application should remain responsive.

Heavy operations must not block the main thread.

Use:

```text
Main Thread
    │
    ├── UI
    ├── Interaction
    └── Rendering
          │
          ↓
       Web Worker
          │
          ├── Parse
          ├── Validate
          ├── Format
          ├── Diff
          ├── Convert
          └── Search
```

The UI should remain interactive during heavy processing.

---

# 19. LOCAL-FIRST PRIVACY ARCHITECTURE

This is a core product requirement.

Default architecture:

```text
User JSON
   ↓
Browser
   ↓
Web Worker
   ↓
Result
```

NOT:

```text
User JSON
   ↓
Server
   ↓
Processing
```

Avoid sending JSON contents to analytics.

Never record:

* JSON content
* JWT payloads
* API responses
* filenames containing sensitive information
* search contents
* clipboard contents

Analytics should track actions, not user data.

Add a visible privacy indicator:

```text
🔒 Processing locally
```

And a dedicated privacy page explaining the architecture.

---

# 20. OFFLINE MODE / PWA

Turn Devure JSON into an installable web application.

Support:

* Install
* Offline application shell
* Offline parsing
* Offline formatting
* Offline validation
* Offline conversion
* Offline viewing

The user should be able to lose internet connectivity and continue working.

---

# 21. HISTORY

Optional local history.

Store only locally.

Show:

```text
Recent
Today
Yesterday
Older
```

Allow:

* Restore
* Delete
* Clear all

Default history should be conservative.

Provide:

```text
Disable history
```

and:

```text
Clear local data
```

---

# 22. FAVORITES / SAVED WORKSPACES

Allow users to locally save:

* JSON documents
* Queries
* JSONPath expressions
* Schema
* Formatting preferences

Everything should remain local unless cloud storage is explicitly introduced later.

---

# 23. SHAREABLE DOCUMENTS

Create a privacy-conscious sharing mechanism.

Preferred approach:

```text
JSON
 ↓
Client-side compression
 ↓
Client-side encryption
 ↓
Share URL
```

or URL-fragment-based sharing where appropriate.

Never expose sensitive JSON to your server by default.

Show:

```text
Anyone with this link may be able to view the shared content.
```

Allow:

* Copy link
* Expiration
* Password protection if server storage is later introduced
* Delete shared document

---

# 24. DOWNLOAD / EXPORT

Support:

* `.json`
* `.txt`
* `.csv`
* `.yaml`
* `.xml`
* generated source code

Export options should respect current transformations.

---

# 25. KEYBOARD-FIRST UX

Create a command palette.

Shortcut:

```text
Cmd/Ctrl + K
```

Commands:

```text
Format JSON
Validate JSON
Minify JSON
Search
Replace
Open file
Download
Copy JSON
Expand all
Collapse all
Compare JSON
Convert to TypeScript
Convert to CSV
Open settings
Toggle theme
```

Keyboard shortcuts:

```text
Ctrl/Cmd + K
Ctrl/Cmd + S
Ctrl/Cmd + F
Ctrl/Cmd + Shift + F
Ctrl/Cmd + Shift + M
Ctrl/Cmd + D
Escape
```

Show shortcuts inside command palette.

---

# 26. THEMING

Support:

* Light
* Dark
* System

Future:

* Dracula
* Nord
* GitHub
* One Dark
* Solarized
* High contrast

Do not make themes visually noisy.

The application should look like a premium developer IDE.

---

# 27. RESPONSIVE DESIGN

Desktop is primary.

But mobile must still work.

Desktop:

```text
Editor | Tree
```

Tablet:

```text
Editor
Tree
```

Mobile:

```text
Editor
↓
Controls
↓
Tree
```

No horizontal overflow.

Touch-friendly controls.

---

# 28. ACCESSIBILITY

Implement:

* Keyboard navigation
* ARIA labels
* Focus management
* Visible focus states
* Screen-reader support
* Proper contrast
* Reduced motion
* Accessible dialogs
* Accessible command palette
* Accessible tree navigation

---

# 29. ERROR UX

Never show cryptic errors where a human explanation is possible.

Bad:

```text
Unexpected token } in JSON at position 183
```

Better:

```text
Invalid JSON

Line 12, Column 18

A closing `}` appears here, but the object is already closed.

[Jump to error]
[Show explanation]
[Repair JSON]
```

---

# 30. FILE HANDLING

Support:

* `.json`
* `.jsonl`
* `.ndjson`

Future:

* `.log`
* API response files

For JSON Lines:

```text
Line 1 ✓
Line 2 ✓
Line 3 ✕
Line 4 ✓
```

---

# 31. JSONL / NDJSON MODE

This can be a very useful developer feature.

Support:

* Validate each line
* Format each record
* Filter records
* Search
* Export
* Convert
* Count records

Example:

```text
Records: 182,402
Valid: 182,390
Invalid: 12
```

---

# 32. API RESPONSE MODE

Create an optional API inspection mode.

User can paste:

```text
HTTP response
```

and see:

```text
Status
Headers
Body
JSON
```

Future browser extension can capture API responses locally.

---

# 33. BROWSER EXTENSION

Create a separate Chrome extension using the current Manifest V3 platform. Chrome's official documentation defines Manifest V3 as the current extension manifest format.

Extension capabilities:

### Right-click

```text
Open selected JSON in Devure
```

### Raw JSON pages

Detect JSON responses and offer:

```text
Open in Devure JSON
```

### Selected JSON

Highlight JSON on any webpage:

```text
Right click
→ Inspect with Devure JSON
```

### Popup

Quick formatter:

```text
Paste JSON
↓
Format
```

### Extension permissions

Request the minimum permissions possible.

Privacy should be a major part of the Chrome Web Store listing.

---

# 34. SEO SITE STRUCTURE

Create dedicated pages.

```text
/json-formatter
/json-validator
/json-viewer
/json-parser
/json-beautifier
/json-minifier
/json-diff
/jsonpath
/json-schema-validator
/json-repair
/json-to-typescript
/json-to-javascript
/json-to-python
/json-to-java
/json-to-go
/json-to-rust
/json-to-csharp
/json-to-swift
/json-to-csv
/json-to-yaml
/json-to-xml
/json-to-toml
/jwt-decoder
/jsonl-viewer
```

Every page must have:

* Unique title
* Unique meta description
* Unique H1
* Explanation
* Tool UI
* Examples
* FAQ
* Internal links
* Canonical
* Open Graph metadata
* Appropriate structured data

Google recommends making content accessible to Search and testing how JavaScript-rendered pages are seen by Google.

Use structured data where it genuinely describes the page; Google documents `SoftwareApplication` structured data for software application pages.

---

# 35. SEO CONTENT HUB

Create:

```text
/guides
```

Topics:

```text
How to format JSON
How to validate JSON
How to fix invalid JSON
JSON syntax errors
JSON vs YAML
JSON vs XML
How to compare JSON
How to convert JSON to TypeScript
How to parse large JSON files
How to use JSONPath
How to validate JSON Schema
What is NDJSON?
How to inspect API responses
How to decode JWT
```

Do not mass-produce generic AI articles.

Every article should solve a real developer problem and link naturally to the relevant tool.

---

# 36. HOMEPAGE

Homepage should communicate within seconds:

```text
Devure JSON

The privacy-first JSON toolkit for developers.

Format, validate, inspect, compare and transform JSON —
directly in your browser.

[Open JSON Tool]

🔒 Your data stays on your device
⚡ Built for large JSON files
⌨️ Keyboard-first
🆓 Free
```

Then show:

* Tool
* Features
* Use cases
* Privacy
* Large-file capability
* Converters
* Keyboard shortcuts
* FAQ
* Developer resources

---

# 37. DESIGN SYSTEM

The UI should be:

* Minimal
* Dense enough for developers
* Modern
* Fast
* Consistent
* Professional

Avoid:

* Excessive gradients
* Giant marketing animations
* Excessive rounded cards
* Huge whitespace inside the actual tool
* Fake SaaS dashboards

Think:

```text
VS Code
+
Raycast
+
Modern developer SaaS
```

The tool itself should dominate the experience.

---

# 38. MICROINTERACTIONS

Use subtle interactions:

* Copy confirmation
* Format completion
* Error jump
* Search result navigation
* Expand/collapse animation
* Toast notifications
* File processing progress

Animations should never slow down the tool.

Respect:

```text
prefers-reduced-motion
```

---

# 39. ANALYTICS

Track product events without collecting JSON.

Events:

```text
tool_opened
json_pasted
file_opened
format_used
validate_used
minify_used
diff_used
jsonpath_used
schema_validation_used
converter_used
download_used
copy_used
share_used
repair_used
large_file_mode_used
extension_install_clicked
github_clicked
```

Record:

* Tool
* Timestamp
* Anonymous session identifier if necessary
* Device category
* Referrer
* Feature

Never record the JSON itself.

---

# 40. PRODUCT METRICS

Track:

### Acquisition

* Visitors
* Search impressions
* Search clicks
* CTR
* Referrers

### Activation

* Users who actually process JSON
* Activation rate

### Engagement

* Operations/user
* Session duration
* Tool usage

### Retention

* 1-day
* 7-day
* 30-day returning users

### SEO

* Indexed pages
* Queries
* Impressions
* Clicks
* CTR
* Average position

### Product

* Formatter usage
* Validator usage
* Diff usage
* Converter usage
* Large-file usage

Google Search Central recommends using Search Console and URL Inspection to understand how Google sees your pages.

---

# 41. TECHNICAL ARCHITECTURE

Keep the application modular.

Recommended structure:

```text
src/
├── app/
├── components/
├── features/
│   ├── editor/
│   ├── viewer/
│   ├── formatter/
│   ├── validator/
│   ├── diff/
│   ├── jsonpath/
│   ├── schema/
│   ├── converters/
│   ├── repair/
│   ├── search/
│   ├── history/
│   └── settings/
│
├── core/
│   ├── parser/
│   ├── formatter/
│   ├── validator/
│   ├── diff/
│   ├── converters/
│   └── workers/
│
├── hooks/
├── stores/
├── utils/
├── types/
└── workers/
```

The UI must never contain heavy business logic.

Use:

```text
UI
 ↓
Feature layer
 ↓
Core engine
 ↓
Worker
```

---

# 42. CORE ENGINE SHOULD BE INDEPENDENT

The JSON processing engine should be independent from React/Next.js.

That allows you to reuse it for:

* Website
* PWA
* Chrome extension
* CLI
* Future desktop app

Example conceptual architecture:

```text
@devure/json-core
@devure/json-format
@devure/json-diff
@devure/json-converters
```

Potential future:

```text
devure-json CLI
```

---

# 43. TESTING REQUIREMENTS

Even though the product itself should not be slowed down by unnecessary testing, the implementation must have strong engineering quality.

Test:

* Parser edge cases
* Unicode
* Huge files
* Deep nesting
* Empty arrays
* Empty objects
* Numbers
* Scientific notation
* Escaping
* Duplicate keys
* Invalid JSON
* Diff correctness
* Converter correctness
* JSONPath correctness

Use benchmark fixtures for:

```text
1 KB
100 KB
1 MB
10 MB
50 MB
100 MB
```

Measure:

* Parse time
* Format time
* Memory
* UI responsiveness

---

# 44. SECURITY

Treat all imported JSON as untrusted data.

Protect against:

* XSS
* Prototype pollution
* Malicious strings
* HTML injection
* SVG/script injection
* Unsafe downloads
* URL injection
* Extension permission abuse

Never render JSON strings as raw HTML.

Sanitize all generated previews.

---

# 45. PERFORMANCE TARGETS

Targets:

### Initial load

Very fast.

### Interaction

Buttons should feel instantaneous.

### Formatting

Small JSON:

```text
<100ms target
```

### Search

Should remain responsive for large documents.

### Large files

No UI freezing during parsing.

### Lighthouse

Aim for excellent:

* Performance
* Accessibility
* Best Practices
* SEO

---

# 46. PHASED BUILD ROADMAP

## Phase 1 — Foundation

Build:

* Design system
* Core editor
* Parser
* Formatter
* Validator
* Tree viewer
* Search
* File upload
* Download
* Dark/light themes
* Keyboard shortcuts

Goal:

> World-class basic JSON experience.

---

## Phase 2 — Professional JSON Toolkit

Build:

* Minifier
* JSON repair
* Diff
* JSONPath
* Copy path
* Advanced search
* Large-file worker architecture
* JSONL/NDJSON
* History
* Settings

Goal:

> Better than ordinary JSON formatter websites.

---

## Phase 3 — Conversion Platform

Build:

* JSON → TypeScript
* JSON → JavaScript
* JSON → Python
* JSON → Java
* JSON → Go
* JSON → Rust
* JSON → C#
* JSON → Kotlin
* JSON → Swift
* JSON → CSV
* JSON → YAML
* JSON → XML
* JSON → TOML

Goal:

> Become a complete JSON transformation toolkit.

---

## Phase 4 — Advanced Developer Tools

Build:

* JSON Schema
* JWT decoder
* API response viewer
* Advanced JSONPath
* Query playground
* Schema generation
* JSONL tools

Goal:

> Become a JSON debugging workstation.

---

## Phase 5 — Privacy & Productivity

Build:

* PWA
* Offline support
* Local history
* Local saved workspaces
* Shareable encrypted links
* Command palette
* Advanced keyboard shortcuts

Goal:

> Become a tool developers keep bookmarked.

---

## Phase 6 — Browser Extension

Build:

* Chrome extension
* Raw JSON detection
* Right-click integration
* Selected JSON inspection
* Popup formatter
* Open in Devure

Use Manifest V3 and keep permissions minimal.

Goal:

> Bring Devure directly into developers' browser workflow.

---

## Phase 7 — SEO

Create all major landing pages.

Build:

* Sitemap
* Robots
* Canonicals
* Metadata
* Structured data
* Internal linking
* Documentation
* Guides
* Examples
* FAQ

Goal:

> Own multiple developer search intents.

---

## Phase 8 — Developer Ecosystem

Create:

```text
GitHub
Chrome extension
CLI
npm packages
Documentation
Developer API
```

Potential future packages:

```text
@devure/json-core
@devure/json-formatter
@devure/json-diff
@devure/json-converter
```

Goal:

> Devure becomes a developer brand rather than one website.

---

# 47. CODING-AGENT DEVELOPMENT RULES

When giving this project to a coding agent, enforce these rules.

## Rule 1

Do not implement everything in one pass.

Build phase-by-phase.

## Rule 2

Before modifying architecture, inspect the existing code.

## Rule 3

Do not duplicate functionality.

Extract shared logic.

## Rule 4

No giant components.

Split by feature.

## Rule 5

No business logic inside presentation components.

## Rule 6

Heavy computation must not block the UI.

## Rule 7

Use workers for expensive operations.

## Rule 8

Do not introduce dependencies without justification.

## Rule 9

Do not sacrifice accessibility for visual design.

## Rule 10

Do not sacrifice performance for animations.

## Rule 11

Do not collect user JSON.

## Rule 12

Every feature must have loading, empty, success and error states.

## Rule 13

Every feature must work with keyboard navigation.

## Rule 14

Every feature must have a polished mobile experience.

## Rule 15

Every new feature must integrate into the command palette where appropriate.

## Rule 16

Do not create duplicate utilities.

## Rule 17

Keep TypeScript strict.

## Rule 18

Use clear domain types.

## Rule 19

Avoid `any`.

## Rule 20

Keep components composable.

---

# 48. DEFINITION OF "BEST"

Do not consider a feature complete merely because it technically works.

Every feature must satisfy:

```text
Functionality
+
UX
+
Performance
+
Accessibility
+
Error handling
+
Keyboard support
+
Responsive design
+
Privacy
+
Maintainability
```

The final application should feel like a product built by a mature developer-tools company.

Not a collection of generated features.

---

# 49. FINAL PRODUCT

The final Devure JSON experience should be:

```text
                 DEVURE JSON
                     │
       ┌─────────────┼─────────────┐
       ↓             ↓             ↓
    INSPECT        TRANSFORM      DEBUG
       │             │             │
   Viewer          Format        Validate
   Tree            Minify        Repair
   Search          Convert       Diff
   JSONPath        Generate      Schema
       │             │             │
       └─────────────┼─────────────┘
                     ↓
                EXPORT / SHARE
                     │
              Copy / Download
              Share / Save
```

The user should be able to arrive with **any JSON-related developer problem** and solve it without leaving Devure.

That is the actual product goal.
