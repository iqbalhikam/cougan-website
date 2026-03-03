# Enable Supabase Realtime (Easiest Way)

The UI for Replication can be confusing. The easiest way to fix this is to run a simple command in your Supabase SQL Editor.

## Option 1: Run SQL Command (Recommended)

1.  Go to your **[Supabase Dashboard](https://supabase.com/dashboard)**.
2.  Click on the **SQL Editor** icon (looks like a terminal `>_`) in the left sidebar.
3.  Click **"New Query"**.
4.  Paste the following command:

    ```sql
    begin;
      -- Remove if already exists to avoid errors
      alter publication supabase_realtime drop table streamers;
    exception when others then null;
    end;

    -- Enable Realtime for the streamers table
    alter publication supabase_realtime add table streamers;
    ```

    _(Note: If your table is named differently in the database, e.g. "Streamer", change `streamers` to `Streamer`)_

5.  Click **RUN**.

## Option 2: Using the UI (If SQL fails)

1.  Go to **Database** in the sidebar.
2.  Click on **Publications** (under "Database Management", NOT "Replication").
3.  Click on `supabase_realtime` (or create it if it doesn't exist).
4.  There should be a list of tables. **Toggle permissions** for the `streamers` table.

Once done, verify your website again. The polling fallback I added will ensure updates happen anyway, but this makes them instant!
