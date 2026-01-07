-- Automatically create a public.users row when a new auth user signs up

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger on auth.users insert
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Also need INSERT policy for users table (was missing)
create policy "users_insert_own" on public.users
  for insert with check (auth.uid() = id);
