# Educational library and book assistant

## Existing architecture and integration

CoLearn remains React 18 / Vite / React Router with Zustand authentication, TanStack Query, Tailwind and the existing blue/yellow components. Supabase Auth, PostgreSQL/RLS, Storage and Edge Functions remain the backend. Retained Django files are not involved in this feature. The existing `services/api.js` → Supabase adapter contracts, reader, notes, bookmarks, XP rewards and admin editor are extended rather than replaced.

The shared auth store already hydrates Supabase's persisted session before routing. Public navigation and marketing CTAs now subscribe to that store; they no longer hardcode signed-out actions. No second session store or auth provider was added.

## Routes and services

| Route / service | Behavior |
| --- | --- |
| `/books` | Public approved catalog; search, subject, language, signed-in progress |
| `/books/:slug` | Metadata, chapters, source, full attribution/license notice and permitted download |
| `/books/:slug/read` | Existing protected reader with saved positions, PDF page controls, assistant and summaries |
| `/library`, `/library/:slug`, `/read/:slug` | Existing routes preserved |
| `/dashboard` | Existing layout with compact My learning / My books section |
| `/admin/books` | Existing editor extended with publication, document, license, chapter and processing controls |
| `book-library` Edge Function | POST `upload`, `file`, `status`, `ask`, `delete`; verifies the existing Auth token and active profile |
| `book-worker` Edge Function | Staff or private scheduler only; runs a bounded leased job step |
| `colearn_reading_position` | Saves chapter position/page under the caller's identity |
| `colearn_queue_book` / `colearn_delete_book_ai` | Staff-only job/reprocess/removal RPCs |

`bookLearning.js` contains the frontend calls. Supabase-generated REST endpoints handle ordinary RLS-protected reads. `book-library` with `{action: "ask", bookId, chapterId, question, conversationId?}` is the equivalent of a book-specific ask endpoint.

## Database and security

Migrations `20260919091800` through `20260919092600` extend `books`, `chapters`, and `reading_progress`; add `chapter_progress`, `book_pages`, `book_chunks`, `book_summaries`, `book_conversations`, `book_messages`, `book_jobs`, `book_ai_usage`, and `book_audit`; and install pgvector, pg_cron and pg_net. Existing user/profile identities and foreign keys are reused.

Only APPROVED books and PUBLISHED chapters are readable by ordinary users. Anonymous visitors may browse approved material. Staff can review all publication states. Direct progress writes, embeddings, staging data, job claims and budget reservations are not available to browser roles. Conversations/messages and chapter positions are private to their owners. A public portfolio also filters out unapproved books.

Approval requires HTTPS source/license/evidence URLs, license name, attribution, changes and evidence notes. Permission must be manually confirmed for the exact edition. The requirement permitting in-app-only licensed use is handled explicitly: `in_app_permission_confirmed` can permit reading while `redistribution_confirmed=false` continues to block downloads. The commercial-use flag records the license's actual terms; it is not assumed true.

Changing the source/license/file clears exact-file permission and requires another review. Chapter changes invalidate approval and the AI generation. Existing unverified demo books are retained as PENDING_REVIEW, with their readers' history intact; they are not silently relabeled as open publications.

## Deployment

From the repository root, with the Supabase CLI authenticated and linked:

```powershell
supabase db push --linked --yes --skip-vault
supabase functions deploy book-library --project-ref ghjdpcvnzclfvyosfhoz --use-api
supabase functions deploy book-worker --project-ref ghjdpcvnzclfvyosfhoz --use-api
node supabase/scripts/configure-book-worker.mjs
```

These operations use the linked cloud project and do not require Docker. The project URL in the scheduler migration targets this repository's COlearn project. For a different deployment, update that URL in a new migration.

`configure-book-worker.mjs` generates a random credential, installs it as an Edge secret and a Vault secret, and removes its temporary ignored files. Cron runs every two seconds **only while work exists**; idle ticks perform no HTTP request. The two book Edge Functions use `verify_jwt=false` because they perform their own Auth validation; the worker additionally accepts its private scheduler credential. Never expose that credential, the service role key or the database URL in React.

## AI configuration

Copy `supabase/.env.books.example` to the ignored root `.env.ai`, fill it locally, then run:

```powershell
supabase secrets set --project-ref ghjdpcvnzclfvyosfhoz --env-file .env.ai
```

| Variable | Default / purpose |
| --- | --- |
| `GEMINI_API_KEY` | Required for generation; server-only |
| `AI_MODEL` | Required; explicitly choose a model available to your Gemini account/free tier |
| `EMBEDDING_PROVIDER` | `supabase` |
| `EMBEDDING_MODEL` | `gte-small`, 384 dimensions |
| `MAX_AI_TOKENS` | 900, bounded to 128–1600 |
| `AI_MONTHLY_BUDGET` | 5 USD in conservative application estimates |
| `MAX_BOOK_FILE_SIZE_MB` | 20; cannot exceed the private bucket's 20 MB cap |
| `BOOK_WORKER_SECRET` | Provisioned automatically; do not put it in frontend configuration |

No external generation request is made until **both** generation variables exist. The application continues to work without them and clearly says the assistant is not configured. Users never enter a payment method or an AI key. Use the provider's free-tier project/quota if paid usage is undesired; provider billing and availability remain account-specific.

`AiDocumentService` and `DocumentProvider` isolate generation from the application. Gemini is the initial implementation; replace or inject a provider behind that interface rather than rewriting the UI. Built-in Supabase `gte-small` generates embeddings without an external API key. Existing PostgreSQL pgvector stores them, so no separate vector database URL or embedding API key is required. Switching embedding dimensions requires a migration and a complete reindex.

Question length is 2–1,500 characters, retrieval is capped at six chunks (RPC maximum eight), and responses are capped by `MAX_AI_TOKENS`. The database serializes budget reservations and allows at most ten requests per user per minute and 5,000 total requests/day. Each generation reserves a conservative **$0.03 application estimate**, including failed attempts. It is deliberately not a provider billing statement. Usage records retain input/output token counts. Set budget to zero to disable generation spending. Adjust the reservation or SQL limits in reviewed code/migrations when changing providers/pricing; account-level provider limits remain the final billing safeguard.

## Admin workflow

1. Add a draft book in `/admin/books` and save its metadata.
2. Add text chapters or upload a PDF/EPUB. Uploads validate type, extension, size, filename, file integrity and SHA-256. PDFs containing scripts/attachments are rejected. EPUB ZIP checksums, expansion limits, paths, container and package are checked.
3. Review source/license/evidence, retain full copyright notices, record changes and commercial-use permission. Save source details first, then manually confirm permission for the exact file/content and save. New source/file details reset old confirmations.
4. For PDFs, review the detected outline if available, or enter chapter names and start/end pages manually. An unreliable chapter guess is never automatically published. Scanned PDFs need a text layer or separately authored readable chapters.
5. Submit for review, then approve after verifying the displayed information. Missing evidence prevents approval in PostgreSQL, including direct API attempts.
6. Process/reprocess the book. Follow the job state/error in the editor. Generate/regenerate summaries after indexing and AI configuration. Review summaries in the reader's Learning summaries tab.
7. Reject or archive for a takedown. This immediately blocks new normal-user reads, AI questions and file-link issuance. Already issued file links expire within 120 seconds; content already delivered to a browser cannot be recalled.
8. Delete AI data to remove generated search/summary data while keeping source chapters and learning history. Delete the book to cascade its content/history and remove its attached private file through the admin UI.

Storage uses a private `book-documents` bucket with no browser access policy. All document links are short lived and issued after server permission checks. A permitted PDF reader necessarily receives document bytes; hiding the download control is a permission/UX rule, not DRM. EPUB is a controlled download, never injected into the website as HTML. Covers keep using the existing book-cover upload flow.

## Processing and retrieval

`book_jobs` tracks queued / processing / completed / failed, kind, revision, stage, cursor, lease, attempts and error. Expired leases are reclaimed up to three times. The admin can enqueue a fresh retry after failure.

PDF extraction processes eight real pages per step and preserves 1-based PDF page numbers. Text chapters do **not** receive invented page numbers. Overlapping chunks retain book/chapter/page references. Embedding runs in small bounded steps to fit the hosted Edge CPU allowance. Publication changes or a mismatched source revision prevent committing a job.

New chunks/pages are staged under the job UUID. A transaction activates the complete generation and deletes obsolete chunks/pages/summaries. Failed processing leaves the previous working generation intact unless the source itself changed. Summary regeneration stages the whole book/chapter set with the job and publishes it transactionally. Long-book summaries sample excerpts across the book/chapter and explicitly acknowledge partial coverage; they are not a guarantee of exhaustive coverage.

Retrieval always filters by book and active generation, combines semantic similarity with PostgreSQL full-text relevance, and boosts the selected chapter. Explicit requests for `page N` or `pages N–M` use only chunks overlapping those real PDF pages; unavailable pages produce uncertainty. Only retrieved evidence reaches the model. Server validation accepts citations only to supplied chunk IDs and derives page links from stored metadata. Unsupported answers use a clear uncertainty response. Questions involving professional advice receive an educational disclaimer. Model grounding reduces errors but does not guarantee factual perfection; read the cited source.

The Ask this book dialog offers conversation history, new/delete conversation, current chapter context, summaries, loading/errors and clickable source citations. PDF navigation uses an explicit saved-page control; native browser PDF scrolling does not expose a reliable page-change event to React.

## Initial content and provenance

`data/books/manifest.json` lists seven guides and 30 chapters adapted from pinned Microsoft MIT-licensed curricula. Each guide's JSON includes the full license, exact commit, original lesson URLs and source checksums. These are clearly identified as selected reading adaptations, with source links for linked labs and exercises. Images/embeds are omitted; fenced code examples are preserved.

`import-open-books.mjs` reproduces the snapshots. When the initial migration already exists, proposed SQL goes to ignored `.dist/open-books-proposed.sql`; it does not rewrite applied migration history. Review source/licensing and create a new migration before changing published editions.

## Verification commands

```powershell
node --test supabase/scripts/book-evidence.test.mjs
deno check --allow-import supabase/functions/book-library/index.ts supabase/functions/book-worker/index.ts
deno test --allow-env supabase/functions/_shared/AiDocumentService.test.ts supabase/functions/_shared/book-files.test.ts
deno run --allow-all supabase/scripts/verify-book-files.ts
node supabase/scripts/verify-book-learning.mjs
node supabase/scripts/verify-book-ui.mjs
cd CoLearner
npm run build
npm run lint
```

Live verification creates disposable accounts and fixture books, then removes them. It requires authorized CLI access to the linked project. The browser script expects an isolated Chromium CDP endpoint on port 9224 and the Vite app on 5176; do not run it concurrently with other scripts controlling that browser. Reports/screenshots live in ignored `.dist/`. Provider adapter tests inject deterministic responses; they do not claim to verify live Gemini generation without credentials.

`node supabase/scripts/drain-book-jobs.mjs` is an optional staff verification helper for the initial collection; normal users do not run a worker on their computers.

## Troubleshooting and limits

- **Assistant not configured:** supply both server generation variables; do not add a `VITE_` key.
- **Missing book:** check approval, active account and chapter publication state. Old demo books require a real license review.
- **Upload/source changed:** confirm the exact new edition again. Old confirmations intentionally do not carry forward.
- **No extractable text:** add a text layer or manual chapters. OCR is not implemented.
- **Missing chapter boundaries:** review PDF outline/pages, then approve and reprocess. PDF files over 500 pages must be split into smaller volumes.
- **Failed job:** read its error, fix the cause, then Process/reprocess. Runtime kills are detected by the lease expiry mechanism.
- **Jobs stay queued:** verify the cron job, Edge deployment and matching Vault/Edge worker secret. Rerun the credential provisioning script if needed.
- **Rate/budget limit:** wait for the rate window or review server budget/usage settings. No client-side flag bypasses these limits.
- **PDF stops loading:** use Reload PDF to obtain a new short-lived link. Native PDF support varies by mobile browser.
- **EPUB:** download is available only when redistribution is confirmed; in-browser EPUB rendering is intentionally unsupported.
- **Storage cleanup:** the admin UI removes attached files. Direct SQL deletion can leave private orphan objects; review Storage if administratively deleting records outside the application.
- **Provider setup:** live generated answers/summaries require credentials. SMTP/OAuth configuration was not changed by this feature.
