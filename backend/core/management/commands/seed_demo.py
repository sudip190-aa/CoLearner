from datetime import timedelta

from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.core.management import BaseCommand, call_command
from django.db import transaction
from django.utils import timezone
from django.utils.text import slugify

from books.models import Book, Chapter, ReadingProgress
from community.models import Comment, Tag, Thread, Vote
from core.models import Report
from gamification.models import Badge, XPEvent
from gamification.services import check_badges
from notifications.models import Notification
from projects.models import JoinRequest, Milestone, Project, ProjectMember, ProjectUpdate, Task
from users.models import Connection, Skill, UserSkill

User = get_user_model()

SKILL_SEEDS = [
    ("JavaScript", "Frontend Engineering"),
    ("TypeScript", "Frontend Engineering"),
    ("React", "Frontend Engineering"),
    ("CSS", "Frontend Engineering"),
    ("Accessibility", "Frontend Engineering"),
    ("Node.js", "Backend & Distributed Systems"),
    ("Python", "Backend & Distributed Systems"),
    ("Django", "Backend & Distributed Systems"),
    ("REST APIs", "Backend & Distributed Systems"),
    ("Redis", "Backend & Distributed Systems"),
    ("System Design", "Computer Systems & Architecture"),
    ("Operating Systems", "Computer Systems & Architecture"),
    ("Rust", "Computer Systems & Architecture"),
    ("Distributed Systems", "Computer Systems & Architecture"),
    ("Algorithms", "Algorithms & Data Structures"),
    ("Data Structures", "Algorithms & Data Structures"),
    ("SQL", "Database Internals & Design"),
    ("PostgreSQL", "Database Internals & Design"),
    ("Data Modeling", "Database Internals & Design"),
    ("dbt", "Database Internals & Design"),
    ("Docker", "DevOps & Cloud Infrastructure"),
    ("AWS", "DevOps & Cloud Infrastructure"),
    ("Terraform", "DevOps & Cloud Infrastructure"),
    ("CI/CD", "DevOps & Cloud Infrastructure"),
    ("Machine Learning", "Applied AI & Machine Learning"),
    ("Prompt Design", "Applied AI & Machine Learning"),
    ("User Research", "Product Engineering & Leadership"),
    ("Product Strategy", "Product Engineering & Leadership"),
    ("Technical Writing", "Product Engineering & Leadership"),
    ("Mentorship", "Product Engineering & Leadership"),
]

USER_SEEDS = [
    {"email": "demo@colearn.dev", "username": "demo-user", "full_name": "Demo User", "role": "learner", "location": "New York, USA", "headline": "Learning systems by building small products.", "bio": "A curious builder exploring better workflows and more thoughtful product rituals.", "availability": "open_to_collaboration", "xp": 3860, "streak_days": 12, "level": 9},
    {"email": "admin@colearn.dev", "username": "admin-user", "full_name": "Admin User", "role": "admin", "location": "Remote", "headline": "Keeping the platform healthy and thoughtful.", "bio": "Admin spends time guiding quality, trust, and community standards.", "availability": "mentoring", "xp": 14400, "streak_days": 31, "level": 22},
    {"email": "maya.chen@colearn.dev", "username": "maya-chen", "full_name": "Maya Chen", "role": "builder", "location": "Toronto, Canada", "headline": "Frontend engineer turning complex flows into calm interfaces.", "bio": "Product-minded frontend engineer with a love for accessibility and design systems.", "availability": "open_to_collaboration", "xp": 6840, "streak_days": 18, "level": 14},
    {"email": "jordan.wright@colearn.dev", "username": "jordan-wright", "full_name": "Jordan Wright", "role": "builder", "location": "Austin, USA", "headline": "Backend builder focused on reliable APIs and thoughtful data models.", "bio": "Works on distributed systems by day and civic prototypes by night.", "availability": "open_to_collaboration", "xp": 9120, "streak_days": 31, "level": 18},
    {"email": "priya.nair@colearn.dev", "username": "priya-nair", "full_name": "Priya Nair", "role": "mentor", "location": "Bengaluru, India", "headline": "Mentor for early-career engineers and product thinkers.", "bio": "Helps teams turn fuzzy ideas into measurable experiments.", "availability": "mentoring", "xp": 12400, "streak_days": 42, "level": 24},
    {"email": "samuel.okafor@colearn.dev", "username": "samuel-okafor", "full_name": "Samuel Okafor", "role": "learner", "location": "Lagos, Nigeria", "headline": "Cloud engineer learning in public, one deployment at a time.", "bio": "Likes infrastructure that is boring in production and exciting to learn from.", "availability": "open_to_collaboration", "xp": 4380, "streak_days": 12, "level": 10},
    {"email": "elena.rossi@colearn.dev", "username": "elena-rossi", "full_name": "Elena Rossi", "role": "builder", "location": "Milan, Italy", "headline": "Design engineer making data-heavy products easier to use.", "bio": "Design and implementation partner for calmer interfaces and strong patterns.", "availability": "open_to_collaboration", "xp": 7560, "streak_days": 9, "level": 15},
    {"email": "david.kim@colearn.dev", "username": "david-kim", "full_name": "David Kim", "role": "learner", "location": "Vancouver, Canada", "headline": "Systems programmer exploring performance from first principles.", "bio": "Writes about operating systems, profiling, and trade-offs under abstractions.", "availability": "focused_learning", "xp": 5920, "streak_days": 21, "level": 12},
    {"email": "lena.petrov@colearn.dev", "username": "lena-petrov", "full_name": "Lena Petrov", "role": "builder", "location": "Berlin, Germany", "headline": "Full-stack developer building tools for creative teams.", "bio": "Loves shipping small, useful products and asking sharp questions.", "availability": "open_to_collaboration", "xp": 8230, "streak_days": 16, "level": 17},
    {"email": "marcus.reed@colearn.dev", "username": "marcus-reed", "full_name": "Marcus Reed", "role": "learner", "location": "Chicago, USA", "headline": "Data engineer learning to explain invisible parts.", "bio": "Builds pipelines and diagrams so that complex systems stay understandable.", "availability": "open_to_collaboration", "xp": 5100, "streak_days": 7, "level": 11},
    {"email": "amina.bello@colearn.dev", "username": "amina-bello", "full_name": "Amina Bello", "role": "mentor", "location": "Accra, Ghana", "headline": "Product designer turning research into useful decisions.", "bio": "Brings a research habit to technical teams and makes the next step obvious.", "availability": "mentoring", "xp": 10100, "streak_days": 27, "level": 20},
    {"email": "noah.williams@colearn.dev", "username": "noah-williams", "full_name": "Noah Williams", "role": "builder", "location": "Melbourne, Australia", "headline": "Mobile developer making thoughtful tools for everyday work.", "bio": "Learning across the stack while shipping useful habit-tracking products.", "availability": "open_to_collaboration", "xp": 6420, "streak_days": 14, "level": 13},
    {"email": "sofia.alvarez@colearn.dev", "username": "sofia-alvarez", "full_name": "Sofia Alvarez", "role": "builder", "location": "Mexico City, Mexico", "headline": "QA engineer who makes quality a team sport.", "bio": "Builds confidence with pragmatic tests and kinder release rituals.", "availability": "open_to_collaboration", "xp": 7350, "streak_days": 23, "level": 15},
    {"email": "ethan.brooks@colearn.dev", "username": "ethan-brooks", "full_name": "Ethan Brooks", "role": "learner", "location": "Manchester, UK", "headline": "Career switcher building a strong foundation in web development.", "bio": "Documents the messy middle of changing careers and celebrates durable wins.", "availability": "focused_learning", "xp": 4670, "streak_days": 9, "level": 10},
]

BADGE_SEEDS = [
    ("first-project", "First Project", "Built your first project on Colearn.", "first_project", 100),
    ("book-collector", "Book Collector", "Completed five books.", "five_books", 250),
    ("community-builder", "Community Builder", "Started your first thread.", "first_thread", 150),
    ("streak-7", "Week Streak", "Maintained a 7-day learning streak.", "streak_7", 200),
    ("streak-30", "30-Day Streak", "Maintained a 30-day learning streak.", "streak_30", 350),
    ("level-5", "Level 5", "Reached level 5.", "level_5", 200),
    ("mentor", "Mentor", "Shared guidance with the community.", "helpful_5", 250),
    ("project-complete", "Project Complete", "Completed a project.", "project_completed", 300),
    ("bookworm", "Bookworm", "Completed a book.", "first_book", 150),
    ("first-task", "First Task", "Completed your first task.", "first_task", 100),
    ("ship-it", "Ship It", "Completed ten tasks.", "ten_tasks", 300),
    ("reviewer", "Reviewer", "Left ten comments.", "ten_comments", 200),
    ("first-milestone", "First Milestone", "Completed a milestone.", "first_milestone", 150),
    ("level-10", "Level 10", "Reached level 10.", "level_10", 350),
]

BOOK_SEEDS = [
    ("Designing Data-Intensive Applications", "Mara Ellison", "A practical guide to reliable and observable systems.", "Computer Systems & Architecture", "advanced", ["systems", "reliability", "architecture"], 420),
    ("The React Rendering Mental Model", "Nadia Brooks", "Build calmer React applications by understanding rendering and state.", "Frontend Engineering", "intermediate", ["React", "JavaScript", "UI architecture"], 250),
    ("Practical PostgreSQL", "Owen Hart", "Model, query, and evolve PostgreSQL databases with confidence.", "Database Internals & Design", "intermediate", ["SQL", "PostgreSQL", "data modeling"], 310),
    ("Django in Small Steps", "Aisha Rahman", "A focused path from URL to database row.", "Backend & Distributed Systems", "beginner", ["Python", "Django", "web development"], 280),
    ("The Accessible Interface", "Nia Carter", "Design interfaces that work for different bodies and technologies.", "Frontend Engineering", "beginner", ["accessibility", "HTML", "inclusive design"], 230),
    ("Algorithms You Can Explain", "Theo Martin", "Use algorithms with clarity and judgment.", "Algorithms & Data Structures", "intermediate", ["algorithms", "data structures", "problem solving"], 265),
    ("Shipping With Confidence", "Sofia Alvarez", "Testing, release habits, and feedback loops for calmer shipping.", "Product Engineering & Leadership", "intermediate", ["testing", "CI/CD", "quality"], 245),
    ("Product Thinking for Builders", "Priya Nair", "A compact guide to finding the right problem and learning from evidence.", "Product Engineering & Leadership", "beginner", ["product", "research", "collaboration"], 210),
    ("Distributed Systems for Curious Teams", "Jordan Lee", "Think through consistency, failures, and trade-offs without drama.", "Computer Systems & Architecture", "advanced", ["distributed systems", "reliability", "ops"], 330),
    ("Prompt Design That Works", "Mina Rios", "Engineer prompts and conversations that stay useful under stress.", "Applied AI & Machine Learning", "intermediate", ["AI", "prompt design", "communication"], 180),
]

PROJECT_SEEDS = [
    ("Open Path", "open-path", "demo-user", "Education", "active", ["React", "Django", "PostgreSQL"], ["demo-user", "maya-chen", "jordan-wright"]),
    ("Civic Signals", "civic-signals", "jordan-wright", "Civic Tech", "active", ["Python", "Django", "PostgreSQL", "Recharts"], ["jordan-wright", "lena-petrov", "marcus-reed"]),
    ("Study Circle", "study-circle", "priya-nair", "Learning", "active", ["React", "Node.js", "SQLite"], ["priya-nair", "david-kim", "sofia-alvarez"]),
    ("Signal Garden", "signal-garden", "maya-chen", "Productivity", "idea", ["React", "TypeScript", "D3"], ["maya-chen", "noah-williams"]),
    ("Quiet Queue", "quiet-queue", "lena-petrov", "Developer Tools", "completed", ["Node.js", "Redis", "PostgreSQL"], ["lena-petrov", "jordan-wright", "sofia-alvarez"]),
    ("Common Ground", "common-ground", "amina-bello", "Collaboration", "active", ["React", "Next.js", "PostgreSQL"], ["amina-bello", "demo-user", "maya-chen"]),
    ("Local Lens", "local-lens", "sofia-alvarez", "Community", "active", ["React", "Django", "Mapbox"], ["sofia-alvarez", "demo-user", "ethan-brooks"]),
    ("Pathfinder", "pathfinder", "ethan-brooks", "Learning", "active", ["React", "TypeScript", "PostgreSQL"], ["ethan-brooks", "samuel-okafor"]),
    ("North Star", "north-star", "david-kim", "Systems", "archived", ["Rust", "PostgreSQL", "Docker"], ["david-kim", "jordan-wright"]),
]

THREAD_SEEDS = [
    ("What makes a project brief useful before the code exists?", "project-brief", "priya-nair", "product", "I am trying to keep our next project brief short enough to use but specific enough to prevent a week of invented assumptions.", ["product", "collaboration", "planning"]),
    ("How are you structuring Terraform modules?", "terraform-module-structure", "jordan-wright", "backend", "I have a small AWS setup that is becoming three environments and a handful of services.", ["devops", "terraform", "architecture"]),
    ("The best first test is the one you can explain", "best-first-test", "david-kim", "frontend", "I am writing a short note for people who feel guilty about not having enough test coverage.", ["testing", "quality", "beginners"]),
    ("How do you keep a learning streak from becoming pressure?", "learning-streak-without-pressure", "ethan-brooks", "career", "Streaks help me return, but I notice I sometimes choose the easiest possible task just to preserve the number.", ["habits", "learning", "wellbeing"]),
    ("What did you learn from your first public demo?", "first-public-demo-lessons", "sofia-alvarez", "community", "I am preparing a five-minute demo and would love to hear what surprised you the first time you showed unfinished work.", ["projects", "demos", "feedback"]),
    ("When is a database migration ready to ship?", "database-migration-ready", "lena-petrov", "backend", "I know the mechanics of migrations, but wonder how to judge whether a live data change is ready.", ["databases", "postgresql", "reliability"]),
    ("What belongs in a portfolio project write-up?", "portfolio-write-up", "maya-chen", "career", "I want to finish one portfolio write-up instead of starting three new experiments.", ["portfolio", "careers", "projects"]),
    ("How do you review a code path without reading 200 lines?", "review-small-changes", "demo-user", "backend", "I want to become more confident in review habits without scanning every line mechanically.", ["code review", "quality", "productivity"]),
    ("We need a calmer onboarding flow for new learners", "calmer-onboarding", "priya-nair", "community", "I keep thinking about how to make a first-week plan feel encouraging instead of overwhelming.", ["education", "ux", "onboarding"]),
    ("What is the smallest useful observability signal?", "smallest-observability-signal", "jordan-wright", "backend", "I am trying to decide which signal tells the team most quickly whether a system is healthy.", ["observability", "systems", "devops"]),
    ("How do you balance focus and community in a learning group?", "balance-focus-community", "amina-bello", "community", "I want a study group to feel welcoming without becoming so broad that no one learns deeply.", ["community", "learning", "facilitation"]),
    ("What makes a good first contribution in an open source project?", "good-first-contribution", "samuel-okafor", "career", "I want to contribute in a way that feels useful without being overwhelming.", ["oss", "career", "learning"]),
]


CHAPTER_TITLES = ["Why this matters", "The core ideas", "A worked example", "Common mistakes", "Putting it into practice"]


def _chapter_text(book_title, tags, index):
    """Realistic multi-paragraph chapter text. Blank line = new paragraph; '> ' = quote; ``` = code block."""
    topic = tags[(index - 1) % len(tags)] if tags else book_title.lower()
    title = CHAPTER_TITLES[index - 1]
    body = "\n\n".join(
        [
            f"This chapter of {book_title} looks at {topic} through the lens of {title.lower()}. The goal is not to memorise terms but to build a mental model you can apply on your next project.",
            f"Start with the smallest version of the problem. When you understand how {topic} behaves in a tiny, boring case, the larger cases stop feeling mysterious. Write down what you expect to happen before you try anything, then compare it with what actually happens.",
            f"> The fastest way to learn {topic} is to change one thing at a time and watch what moves.",
            f"Teams that do this well share a habit: they keep feedback loops short. They run the code, read the result, and adjust within minutes rather than days. That habit matters more than any single technique in this book.",
            "```\n# Try it yourself\nnote = 'what I expected'\nresult = 'what actually happened'\nprint(note, '->', result)\n```",
            f"Before moving on, explain {topic} out loud in two sentences, as if to a teammate who joined this week. If you get stuck, that is exactly the part to reread. Chapter {index} ends here; the next one builds directly on it.",
        ]
    )
    return title, body


def _ensure_user(email, username, full_name, role, **extra):
    user = User.objects.filter(email__iexact=email).first()
    if user is None:
        user = User.objects.create_user(
            email=email,
            username=username,
            full_name=full_name,
            role=role,
            **extra,
        )
    else:
        if user.username != username:
            user.username = username
        for field_name, value in extra.items():
            setattr(user, field_name, value)
        user.save(update_fields=["username", "full_name", "role", *extra.keys()])
    return user


class Command(BaseCommand):
    help = "Seed demo data for Colearn with realistic user, project, book, and discussion data."

    def add_arguments(self, parser):
        parser.add_argument("--flush", action="store_true", help="Flush the database before seeding.")

    @transaction.atomic
    def handle(self, *args, **options):
        if options.get("flush"):
            call_command("flush", interactive=False)

        for item in SKILL_SEEDS:
            skill_name, category = item
            Skill.objects.get_or_create(name=skill_name, defaults={"slug": slugify(skill_name), "category": category})

        skill_map = {skill.name: skill for skill in Skill.objects.all()}

        for seed in USER_SEEDS:
            email = seed["email"]
            username = seed["username"]
            full_name = seed["full_name"]
            role = seed["role"]
            password = "colearn123"
            user = User.objects.filter(email__iexact=email).first()
            if user is None:
                user = User.objects.create_user(
                    email=email,
                    username=username,
                    full_name=full_name,
                    role=role,
                    password=password,
                    is_active=True,
                    is_staff=email == "admin@colearn.dev",
                    is_superuser=email == "admin@colearn.dev",
                )
            else:
                if user.username != username:
                    user.username = username
                for field_name, value in {
                    "full_name": full_name,
                    "role": role,
                    "location": seed.get("location", ""),
                    "headline": seed.get("headline", ""),
                    "bio": seed.get("bio", ""),
                    "availability": seed.get("availability", ""),
                    "xp": seed.get("xp", 0),
                    "level": seed.get("level", 1),
                    "streak_days": seed.get("streak_days", 0),
                    "last_active": timezone.now() - timedelta(days=1),
                    "onboarding_completed": True,
                }.items():
                    setattr(user, field_name, value)
                if email == "admin@colearn.dev":
                    user.is_staff = True
                    user.is_superuser = True
                if not user.has_usable_password():
                    user.set_password(password)
                user.save()

            if email == "admin@colearn.dev":
                user.is_staff = True
                user.is_superuser = True
                if not user.has_usable_password():
                    user.set_password(password)
                user.onboarding_completed = True
                user.save(update_fields=["username", "full_name", "role", "is_staff", "is_superuser", "password", "onboarding_completed"])
                continue

            if user.username != username:
                user.username = username
            for field_name, value in {
                "full_name": full_name,
                "role": role,
                "location": seed.get("location", ""),
                "headline": seed.get("headline", ""),
                "bio": seed.get("bio", ""),
                "availability": seed.get("availability", ""),
                "xp": seed.get("xp", 0),
                "level": seed.get("level", 1),
                "streak_days": seed.get("streak_days", 0),
                "last_active": timezone.now() - timedelta(days=1),
                # Seeded people are set up already; otherwise logging in as the demo user lands on the onboarding wizard.
                "onboarding_completed": True,
            }.items():
                setattr(user, field_name, value)
            if not user.has_usable_password():
                user.set_password(password)
            user.save()

        demo_user = User.objects.get(email="demo@colearn.dev")
        admin_user = User.objects.get(email="admin@colearn.dev")
        users = list(User.objects.exclude(email="admin@colearn.dev"))

        for idx, user in enumerate(users):
            picks = ["Python", "Django", "React", "TypeScript", "SQL", "AWS", "Docker", "PostgreSQL", "Algorithms", "User Research", "Mentorship"]
            for skill_name in picks[: min(4, idx % 4 + 2)]:
                skill = skill_map.get(skill_name)
                if skill:
                    UserSkill.objects.get_or_create(user=user, skill=skill, defaults={"level": "intermediate"})

        # Badges ship in a data migration; the seed only tops up anything missing, then awards what people have really earned.
        for badge_slug, name, description, criteria_key, xp_reward in BADGE_SEEDS:
            Badge.objects.get_or_create(slug=badge_slug, defaults={"name": name, "description": description, "criteria_key": criteria_key, "xp_reward": xp_reward})

        today = timezone.localdate().isoformat()
        for user in User.objects.all():
            XPEvent.objects.get_or_create(user=user, reason="daily_login", source=f"login:{today}", defaults={"amount": 5})

        demo_user = User.objects.filter(username="demo-user").first()
        # slug -> number of chapters the demo user has finished (the first two seeded books)
        demo_reading_slugs = {slugify(BOOK_SEEDS[0][0]): 2, slugify(BOOK_SEEDS[1][0]): 4}

        for title, author, description, category, difficulty, tags, est_minutes in BOOK_SEEDS:
            book, _ = Book.objects.get_or_create(
                slug=slugify(title),
                defaults={
                    "title": title,
                    "author": author,
                    "description": description,
                    "category": category,
                    "difficulty": difficulty,
                    "tags": tags,
                    "est_minutes": est_minutes,
                    "total_pages": est_minutes,
                    "published_at": timezone.now() - timedelta(days=30),
                },
            )
            for idx in range(1, 6):
                chapter_title, content = _chapter_text(title, tags, idx)
                Chapter.objects.update_or_create(
                    book=book,
                    chapter_number=idx,
                    defaults={"title": chapter_title, "content": content, "slug": f"{slugify(title)}-{idx}"},
                )
            chapters = list(book.chapters.all())
            for user in users[: min(4, len(users))]:
                if user.username == "demo-user":
                    continue  # the demo account gets a partly-read shelf below so "Continue reading" has something to show
                ReadingProgress.objects.get_or_create(
                    user=user,
                    book=book,
                    defaults={"chapter": chapters[0], "progress_percent": 100, "completed": True, "completed_chapters": [chapter.id for chapter in chapters], "book_completion_awarded": True},
                )
            if demo_user is not None and book.slug in demo_reading_slugs:
                done = chapters[: demo_reading_slugs[book.slug]]
                ReadingProgress.objects.get_or_create(
                    user=demo_user,
                    book=book,
                    defaults={"chapter": chapters[len(done)] if len(done) < len(chapters) else chapters[-1], "progress_percent": round(100 * len(done) / len(chapters)), "completed": False, "completed_chapters": [c.id for c in done], "last_read_at": timezone.now()},
                )

        # Earlier seeds used statuses the API does not know (in_progress, review, planning); map them to real ones.
        Project.objects.filter(status__in=["in_progress", "review", "planning"]).update(status=Project.STATUS_ACTIVE)

        for title, slug_value, owner_name, category, status, tech_stack, members in PROJECT_SEEDS:
            owner = User.objects.get(username=owner_name)
            project, _ = Project.objects.get_or_create(
                slug=slug_value,
                defaults={
                    "owner": owner,
                    "title": title,
                    "summary": f"Demo project for {title}.",
                    "description": f"A realistic demo project representing {title}.",
                    "category": category,
                    "tech_stack": tech_stack,
                    "status": status,
                    "max_members": 5,
                    "is_public": True,
                    "looking_for_roles": ["Frontend developer", "Product designer"] if status in ("idea", "active") else [],
                },
            )
            ProjectMember.objects.get_or_create(project=project, user=owner, defaults={"role": "owner"})
            for member_name in members:
                member = User.objects.get(username=member_name)
                ProjectMember.objects.get_or_create(project=project, user=member, defaults={"role": "member"})
            team = [User.objects.get(username=name) for name in members]
            board = ["todo", "in_progress", "review", "done"]
            for index in range(1, 5):
                Task.objects.get_or_create(
                    project=project,
                    title=f"Task {index} for {title}",
                    defaults={
                        "assignee": team[(index - 1) % len(team)],
                        "status": "done" if project.status == "completed" else board[(index - 1) % 4],
                        "priority": ["low", "medium", "high", "medium"][(index - 1) % 4],
                        "order": index,
                    },
                )
            for index in range(1, 3):
                Milestone.objects.get_or_create(
                    project=project,
                    title=f"Milestone {index} for {title}",
                    defaults={"description": "Demo milestone.", "status": "done" if index == 1 else "in_progress"},
                )
            for index in range(1, 3):
                ProjectUpdate.objects.get_or_create(
                    project=project,
                    author=owner,
                    body=f"Update {index} for {title}.",
                )

        commenter_usernames = sorted(seed["username"] for seed in USER_SEEDS if seed["email"] != "admin@colearn.dev")

        for title, slug_value, author_name, category, body, tags in THREAD_SEEDS:
            author = User.objects.get(username=author_name)
            thread, _ = Thread.objects.get_or_create(slug=slug_value, defaults={"author": author, "title": title, "body": body, "category": category, "views": 400})
            if tags:
                for tag_name in tags:
                    tag, _ = Tag.objects.get_or_create(name=tag_name, defaults={"slug": slugify(tag_name)})
                    thread.tags.add(tag)
            for idx in range(1, 4):
                # Deterministic pick so re-running the seed matches existing comments instead of duplicating them.
                comment_author = User.objects.get(username=commenter_usernames[(thread.pk + idx) % len(commenter_usernames)])
                Comment.objects.get_or_create(
                    thread=thread,
                    author=comment_author,
                    body=f"Comment {idx} on {title}.",
                )
            thread_ct = ContentType.objects.get_for_model(Thread)
            Vote.objects.get_or_create(user=author, content_type=thread_ct, object_id=thread.id, defaults={"value": 1})

        # Earlier seeds made placeholder notifications with no target; real ones now come from real activity.
        Notification.objects.filter(verb__in=["new_activity", "badge_earned"]).delete()

        user_ct = ContentType.objects.get_for_model(User)
        for user in User.objects.exclude(email="admin@colearn.dev"):
            Report.objects.get_or_create(
                reporter=admin_user,
                content_type=user_ct,
                object_id=user.id,
                reason="Needs a quick profile refresh.",
                defaults={"status": "open"},
            )

        for user in User.objects.all():
            user.refresh_from_db()
            check_badges(user)

        self.stdout.write(self.style.SUCCESS("Seeded Colearn demo data: 14 users, 30 skills, 10 books, 9 projects, 12 threads, and demo badges/notifications."))
