# Book learning delivery record

Implemented in the existing React/Supabase application. Nine migrations were applied to COlearn (`ghjdpcvnzclfvyosfhoz`); `book-library` and `book-worker` were deployed. Seven approved MIT-licensed reading adaptations contain 30 chapters and 565 indexed chunks. Legacy unverified books remain pending review with their data preserved.

## Verification

- Production frontend build and full ESLint check passed.
- Both new Edge Functions passed Deno type checking.
- 14 unit tests passed: five existing library tests, four evidence/security tests, three injected AI provider tests and two EPUB integrity tests.
- Live Supabase checks passed for RLS, approval, private progress, real embeddings/retrieval, processing/reprocessing, PDF extraction/uploads, page metadata, rate limits and budget enforcement, including invalid budget settings.
- Live EPUB checks passed for valid upload/checksum, corrupt ZIP rejection, traversal rejection and private-file cleanup.
- Desktop/mobile browser checks passed for catalog/search, license display, persisted authentication, reading/resume/completion, assistant configuration state, dashboard, admin approval and existing library/projects/people/messages routes. No browser errors or unexpected HTTP failures. An expected HTTP 400 verifies rejection of approval without license evidence.
- Disposable test users/books/files were removed, including a draft left by an interrupted browser run.
- Live generated answers and summaries have NOT been verified: generation credentials are absent. Injected provider tests verify response/citation handling without calling a live model.

The operational guide, commands, environment settings and limitations are in [BOOK_LEARNING.md](BOOK_LEARNING.md). Local verification reports and screenshots are in ignored `.dist/`.

## All changed and added files

- [.gitignore](../.gitignore)
- [CoLearner/src/components/books/BookAssistant.jsx](../CoLearner/src/components/books/BookAssistant.jsx)
- [CoLearner/src/components/books/BookLicense.jsx](../CoLearner/src/components/books/BookLicense.jsx)
- [CoLearner/src/components/books/BookPdf.jsx](../CoLearner/src/components/books/BookPdf.jsx)
- [CoLearner/src/components/books/BookPublishing.jsx](../CoLearner/src/components/books/BookPublishing.jsx)
- [CoLearner/src/components/books/MyLearning.jsx](../CoLearner/src/components/books/MyLearning.jsx)
- [CoLearner/src/components/landing/LandingFooter.jsx](../CoLearner/src/components/landing/LandingFooter.jsx)
- [CoLearner/src/components/landing/LandingNav.jsx](../CoLearner/src/components/landing/LandingNav.jsx)
- [CoLearner/src/components/landing/MarketingPage.jsx](../CoLearner/src/components/landing/MarketingPage.jsx)
- [CoLearner/src/components/layout/Navbar.jsx](../CoLearner/src/components/layout/Navbar.jsx)
- [CoLearner/src/components/ui/RichText.jsx](../CoLearner/src/components/ui/RichText.jsx)
- [CoLearner/src/hooks/useReadingPosition.js](../CoLearner/src/hooks/useReadingPosition.js)
- [CoLearner/src/pages/BookCatalog.jsx](../CoLearner/src/pages/BookCatalog.jsx)
- [CoLearner/src/pages/BookDetail.jsx](../CoLearner/src/pages/BookDetail.jsx)
- [CoLearner/src/pages/Dashboard.jsx](../CoLearner/src/pages/Dashboard.jsx)
- [CoLearner/src/pages/Landing.jsx](../CoLearner/src/pages/Landing.jsx)
- [CoLearner/src/pages/Reader.jsx](../CoLearner/src/pages/Reader.jsx)
- [CoLearner/src/pages/admin/Books.jsx](../CoLearner/src/pages/admin/Books.jsx)
- [CoLearner/src/routes.jsx](../CoLearner/src/routes.jsx)
- [CoLearner/src/services/api.js](../CoLearner/src/services/api.js)
- [CoLearner/src/services/bookLearning.js](../CoLearner/src/services/bookLearning.js)
- [CoLearner/src/services/supabase/adapter.js](../CoLearner/src/services/supabase/adapter.js)
- [CoLearner/src/services/supabase/read-models.js](../CoLearner/src/services/supabase/read-models.js)
- [README.md](../README.md)
- [data/books/connected-systems.json](../data/books/connected-systems.json)
- [data/books/data-science-foundations.json](../data/books/data-science-foundations.json)
- [data/books/generative-ai-foundations.json](../data/books/generative-ai-foundations.json)
- [data/books/javascript-foundations.json](../data/books/javascript-foundations.json)
- [data/books/machine-learning-foundations.json](../data/books/machine-learning-foundations.json)
- [data/books/manifest.json](../data/books/manifest.json)
- [data/books/web-development-foundations.json](../data/books/web-development-foundations.json)
- [data/books/working-with-data.json](../data/books/working-with-data.json)
- [supabase/.env.books.example](.env.books.example)
- [supabase/BOOK_LEARNING.md](BOOK_LEARNING.md)
- [supabase/BOOK_LEARNING_CHANGES.md](BOOK_LEARNING_CHANGES.md)
- [supabase/config.toml](config.toml)
- [supabase/functions/_shared/AiDocumentService.test.ts](functions/_shared/AiDocumentService.test.ts)
- [supabase/functions/_shared/AiDocumentService.ts](functions/_shared/AiDocumentService.ts)
- [supabase/functions/_shared/book-evidence.mjs](functions/_shared/book-evidence.mjs)
- [supabase/functions/_shared/book-files.test.ts](functions/_shared/book-files.test.ts)
- [supabase/functions/_shared/core.ts](functions/_shared/core.ts)
- [supabase/functions/book-library/index.ts](functions/book-library/index.ts)
- [supabase/functions/book-worker/index.ts](functions/book-worker/index.ts)
- [supabase/migrations/20260919091800_book_learning.sql](migrations/20260919091800_book_learning.sql)
- [supabase/migrations/20260919091900_book_jobs.sql](migrations/20260919091900_book_jobs.sql)
- [supabase/migrations/20260919092000_open_educational_books.sql](migrations/20260919092000_open_educational_books.sql)
- [supabase/migrations/20260919092100_book_worker_schedule.sql](migrations/20260919092100_book_worker_schedule.sql)
- [supabase/migrations/20260919092200_book_worker_reliability.sql](migrations/20260919092200_book_worker_reliability.sql)
- [supabase/migrations/20260919092300_book_progress_contract.sql](migrations/20260919092300_book_progress_contract.sql)
- [supabase/migrations/20260919092400_preserve_book_examples.sql](migrations/20260919092400_preserve_book_examples.sql)
- [supabase/migrations/20260919092500_targeted_book_jobs.sql](migrations/20260919092500_targeted_book_jobs.sql)
- [supabase/migrations/20260919092600_book_budget_validation.sql](migrations/20260919092600_book_budget_validation.sql)
- [supabase/scripts/book-evidence.test.mjs](scripts/book-evidence.test.mjs)
- [supabase/scripts/configure-book-worker.mjs](scripts/configure-book-worker.mjs)
- [supabase/scripts/drain-book-jobs.mjs](scripts/drain-book-jobs.mjs)
- [supabase/scripts/import-open-books.mjs](scripts/import-open-books.mjs)
- [supabase/scripts/verify-book-files.ts](scripts/verify-book-files.ts)
- [supabase/scripts/verify-book-learning.mjs](scripts/verify-book-learning.mjs)
- [supabase/scripts/verify-book-ui.mjs](scripts/verify-book-ui.mjs)
