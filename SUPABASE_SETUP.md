# Supabase Setup Instructions

This app is configured to use Supabase for authentication and data storage. Follow these steps to connect your own Supabase project:

## 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign up/login
2. Create a new project
3. Wait for the project to finish setting up

## 2. Get Your Credentials

1. Go to Project Settings > API
2. Copy your **Project URL** and **anon/public key**

## 3. Configure the App

You have two options to add your credentials:

### Option A: Using Environment Variables (Recommended)
1. Create a `.env` file in the project root
2. Add your credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### Option B: Direct Configuration
1. Open `src/lib/supabase.ts`
2. Replace the placeholder values:
   ```typescript
   const supabaseUrl = 'YOUR_SUPABASE_URL';
   const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';
   ```

## 4. Set Up Database Tables

Run these SQL commands in the Supabase SQL Editor (Dashboard > SQL Editor):

### Create Profiles Table
```sql
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);
```

### Create Time Tracking Table
```sql
create table public.time_entries (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  website text not null,
  category text,
  duration integer not null, -- duration in seconds
  productive boolean default true,
  date date default current_date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.time_entries enable row level security;

create policy "Users can view own entries"
  on time_entries for select
  using (auth.uid() = user_id);

create policy "Users can insert own entries"
  on time_entries for insert
  with check (auth.uid() = user_id);

create policy "Users can update own entries"
  on time_entries for update
  using (auth.uid() = user_id);

create policy "Users can delete own entries"
  on time_entries for delete
  using (auth.uid() = user_id);
```

### Create Blocked Sites Table
```sql
create table public.blocked_sites (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  url text not null,
  category text default 'Custom',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.blocked_sites enable row level security;

create policy "Users can view own blocked sites"
  on blocked_sites for select
  using (auth.uid() = user_id);

create policy "Users can insert own blocked sites"
  on blocked_sites for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own blocked sites"
  on blocked_sites for delete
  using (auth.uid() = user_id);
```

### Create User Settings Table
```sql
create table public.user_settings (
  id uuid references auth.users on delete cascade primary key,
  daily_goal integer default 8,
  break_reminders boolean default true,
  email_reports boolean default true,
  sound_notifications boolean default false,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.user_settings enable row level security;

create policy "Users can view own settings"
  on user_settings for select
  using (auth.uid() = id);

create policy "Users can update own settings"
  on user_settings for update
  using (auth.uid() = id);

create policy "Users can insert own settings"
  on user_settings for insert
  with check (auth.uid() = id);
```

### Create Profile Trigger (Auto-create profile on signup)
```sql
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  
  insert into public.user_settings (id)
  values (new.id);
  
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

## 5. Configure Authentication

1. In Supabase Dashboard, go to Authentication > URL Configuration
2. Add your site URL (e.g., `http://localhost:8080` for local dev)
3. Add redirect URLs for authentication callbacks

## 6. Optional: Disable Email Confirmation (for testing)

1. Go to Authentication > Providers > Email
2. Disable "Confirm email" for faster testing
3. **Remember to enable this in production!**

## 7. Start the App

```bash
npm run dev
```

Your FocusNest app should now be connected to Supabase!

## Troubleshooting

- **"Invalid API key"**: Double-check your credentials in `.env` or `supabase.ts`
- **"Row Level Security policy violation"**: Make sure you've enabled RLS and created the policies above
- **Authentication redirect errors**: Verify your Site URL and Redirect URLs in Supabase settings
