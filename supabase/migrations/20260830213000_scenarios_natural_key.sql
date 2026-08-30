alter table scenarios
  add constraint scenarios_mode_title_key unique (mode, title);
