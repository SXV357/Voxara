alter table sessions
  add column status text not null default 'processing',
  add column error_message text;

alter table sessions
  add constraint sessions_status_check
  check (status in ('processing', 'complete', 'failed'));
