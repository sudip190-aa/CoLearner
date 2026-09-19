from django.db import migrations

# (slug, name, description, criteria_key, xp_reward, icon). Kept inline so the migration never depends on app code.
DEFAULT_BADGES = [
    ("page-turner", "Page Turner", "Finished your first chapter.", "first_chapter", 50, "book-open"),
    ("bookworm", "Bookworm", "Completed a book.", "first_book", 150, "book-check"),
    ("book-collector", "Book Collector", "Completed five books.", "five_books", 250, "library"),
    ("first-project", "First Project", "Started or joined your first project.", "first_project", 100, "rocket"),
    ("first-task", "First Task", "Completed your first task.", "first_task", 100, "circle-check"),
    ("ship-it", "Ship It", "Completed ten tasks.", "ten_tasks", 300, "package-check"),
    ("first-milestone", "First Milestone", "Completed a project milestone.", "first_milestone", 150, "flag"),
    ("project-complete", "Project Complete", "Took a project all the way to completed.", "project_completed", 300, "trophy"),
    ("community-builder", "Community Builder", "Started your first thread.", "first_thread", 150, "message-square"),
    ("reviewer", "Reviewer", "Left ten comments.", "ten_comments", 200, "messages-square"),
    ("mentor", "Mentor", "Got five upvotes on your comments.", "helpful_5", 250, "heart-handshake"),
    ("streak-7", "Week Streak", "Maintained a 7-day learning streak.", "streak_7", 200, "flame"),
    ("streak-30", "30-Day Streak", "Maintained a 30-day learning streak.", "streak_30", 350, "calendar-check"),
    ("level-5", "Level 5", "Reached level 5.", "level_5", 200, "star"),
    ("level-10", "Level 10", "Reached level 10.", "level_10", 350, "crown"),
]


def add_default_badges(apps, schema_editor):
    Badge = apps.get_model("gamification", "Badge")
    for slug, name, description, criteria_key, xp_reward, icon in DEFAULT_BADGES:
        Badge.objects.get_or_create(
            slug=slug,
            defaults={"name": name, "description": description, "criteria_key": criteria_key, "xp_reward": xp_reward, "icon": icon},
        )


class Migration(migrations.Migration):
    dependencies = [("gamification", "0001_initial")]
    operations = [migrations.RunPython(add_default_badges, migrations.RunPython.noop)]
