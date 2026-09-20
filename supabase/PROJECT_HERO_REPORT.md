# Project hero and theme refinement

## Presentation

The project detail page now leads with the project's uploaded cover in a full-width, responsive banner. The whole image remains visible using `object-contain`; opening it shows the original image. Where only gallery images exist, the first one becomes the banner and is excluded from the gallery below. Other images remain available in Overview. Projects without images, or with a failed cover, use a compact information-led hero instead of an empty image card.

Project title, summary, status, category, creator, date and existing actions sit below the image. Navigation and detail sections follow. Dark mode uses solid existing theme surfaces with no generated cover gradient. The page resets when the project slug changes, preventing the previous project's content, tabs or image-error state from carrying into another project.

The supplied `src/assets/logo2.svgz` is preserved. Its browser-ready `logo2.svg` retains the artwork, adds a sans-serif font fallback and removes an off-canvas reference to a missing Illustrator export image. Dark mode displays that SVG directly; light mode retains `logo.png`. Navigation logos use a 32px visible height on desktop and 28px on mobile without changing aspect ratio.

## Focused verification

`scripts/verify-project-hero-ui.mjs` uses the actual create/edit UI, isolated browser contexts and disposable accounts against the linked Supabase project. It verifies:

- Project creation with a real image upload, stored cover path and refresh persistence.
- Workspace cover replacement and the updated banner after refresh.
- Landscape and portrait images without cropping or stretching.
- Dynamic titles and images across multiple projects, gallery promotion without duplication, and missing/failed-image fallback.
- Correct supplied logos, both themes, usable tabs and no page overflow at 1440, 1280, 768, 390 and 320px.
- No browser exceptions or failed network responses during those checks.

Desktop, tablet and mobile screenshots were inspected. Test accounts, projects and uploaded images were removed; reports/screenshots are kept in the ignored `.dist/` directory. The script also accepts `COLEARN_TEST_ORIGIN` for checking the deployed frontend.

## Existing functionality

The existing project regression suites cover creation/editing, filtering and latest-first ordering, invitations, join requests, membership, workspace controls, deletion, links, gallery uploads, replies, notification counters, ownership and non-member access. Group-voice checks use three isolated browser accounts and synthetic microphone audio, including all six audio directions, mute, leave, rejoin, refresh, removal, permission cancellation and stalled-signaling cleanup.

These voice checks do not replace physical-device or TURN-relay testing. The existing relay/SMTP/AI configuration limitations remain documented in [DEPLOYMENT.md](DEPLOYMENT.md) and [VOICE_SETUP.md](VOICE_SETUP.md).

## Release verification — 2026-09-20

- The focused project-hero browser suite passed all four groups described above.
- All 30 existing regression configurations passed, including the project-specific creation/join workflow, project chat/voice, project filtering, social features, messages/replies, notifications, profiles, learning, OAuth handoffs and authentication links.
- The theme sweep passed 123 page states, with additional form/dialog checks in both themes. The production bundle passed authenticated deep links, theme persistence, mobile layout and logout protection.
- Six existing library and safe-link unit tests passed. ESLint, the production build, formatting and `git diff --check` passed.
- The first library-reader run exceeded its 27-second content wait without a browser exception or failed API response. The same unmodified suite passed on retry, including saved progress, completion, admin publishing and logout. Both attempts are retained in the local verification records.
- Temporary verification accounts and uploads were cleaned up. The changed-source credential scan found no private credentials; environment files and `.dist/` remain Git-ignored.

The reviewed changes contain the project presentation, shared logo sizing/assets, verification scripts and this report. Backend permissions and application data structures are unchanged. Real mailbox delivery, provider-account consent and physical-network voice tests are not claimed by these automated checks.
