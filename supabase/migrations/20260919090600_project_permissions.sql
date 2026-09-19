-- INSERT ... RETURNING must see the owner directly, before membership is added.
drop policy if exists projects_read on public.projects;
create policy projects_read on public.projects for select to authenticated using(app.active() and (owner_id=auth.uid() or is_public or app.member(id) or app.staff()));
drop policy milestones_write on public.milestones;
create policy milestones_insert on public.milestones for insert to authenticated with check(app.member(project_id) or app.staff());
create policy milestones_update on public.milestones for update to authenticated using(app.member(project_id) or app.staff()) with check(app.member(project_id) or app.staff());
create policy milestones_delete on public.milestones for delete to authenticated using(app.owner(project_id) or app.staff());
