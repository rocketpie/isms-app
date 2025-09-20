## 5) Calling patterns from clients/tests

* Grant role (admin token):

  ```
  POST /rpc/admin_grant_app_role
  Accept-Profile: app
  Content-Profile: app
  { "target_email": "editor@example.com", "new_role": "editor" }
  ```

* Who am I (any token):

  ```
  GET /whoami
  Accept-Profile: app
  ```

* If you don’t want headers: set `PGRST_DB_SCHEMAS=app,isms` and call unqualified endpoints.

That’s all you need to change in the context and codebase. After applying the two migrations and adjusting the PostgREST env, your existing `test.sh` flow should pass end-to-end.
