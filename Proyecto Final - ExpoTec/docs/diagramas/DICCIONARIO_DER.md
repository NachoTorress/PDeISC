# Diccionario del DER físico

Fuente: Migraciones 001–010 más schema_migrations en el motor; sin introspección de la base privada.

32 tablas, 169 atributos y 40 restricciones FK. Las FK compuestas se representan como una relación, no como varias relaciones independientes.

## Entidades

| Tabla | PK | Atributos | FK | Fuente |
| --- | --- | --- | --- | --- |
| `users` | `id` | 7 | 0 | backend/sql/001_auth.sql:1 |
| `roles` | `code` | 1 | 0 | backend/sql/001_auth.sql:11 |
| `user_roles` | `user_id, role_code` | 2 | 2 | backend/sql/001_auth.sql:17 |
| `sessions` | `id` | 5 | 1 | backend/sql/001_auth.sql:25 |
| `refresh_tokens` | `token_hash` | 4 | 1 | backend/sql/001_auth.sql:35 |
| `auth_rate_limits` | `bucket` | 3 | 0 | backend/sql/001_auth.sql:44 |
| `spaces` | `id` | 7 | 0 | backend/sql/002_spaces.sql:1 |
| `furniture` | `space_id, code` | 11 | 1 | backend/sql/002_spaces.sql:11 |
| `booths` | `id` | 4 | 1 | backend/sql/002_spaces.sql:27 |
| `projects` | `id` | 16 | 2 | backend/sql/003_projects.sql:1 |
| `project_members` | `project_id, user_id` | 2 | 2 | backend/sql/003_projects.sql:24 |
| `project_teachers` | `project_id, user_id` | 2 | 2 | backend/sql/003_projects.sql:33 |
| `subjects` | `id` | 2 | 0 | backend/sql/003_projects.sql:42 |
| `project_subjects` | `project_id, subject_id` | 2 | 2 | backend/sql/003_projects.sql:47 |
| `booth_allocations` | `booth_id` | 2 | 2 | backend/sql/003_projects.sql:55 |
| `project_reviews` | `id` | 6 | 2 | backend/sql/003_projects.sql:62 |
| `resources` | `id` | 8 | 0 | backend/sql/004_inventory.sql:1 |
| `project_resource_requests` | `project_id, resource_id` | 3 | 2 | backend/sql/004_inventory.sql:13 |
| `resource_allocations` | `project_id, resource_id` | 3 | 1 | backend/sql/004_inventory.sql:22 |
| `inventory_events` | `id` | 7 | 2 | backend/sql/004_inventory.sql:31 |
| `loans` | `id` | 11 | 4 | backend/sql/005_loans.sql:1 |
| `loan_returns` | `id` | 7 | 2 | backend/sql/005_loans.sql:22 |
| `resource_conditions` | `resource_id` | 2 | 1 | backend/sql/005_loans.sql:35 |
| `inventory_condition_events` | `event_id` | 5 | 2 | backend/sql/005_loans.sql:41 |
| `gallery_photos` | `id` | 8 | 1 | backend/sql/006_gallery.sql:3 |
| `gallery_reviews` | `id` | 7 | 2 | backend/sql/006_gallery.sql:17 |
| `social_providers` | `code` | 1 | 0 | backend/sql/007_social.sql:1 |
| `social_identities` | `provider, subject` | 4 | 2 | backend/sql/007_social.sql:6 |
| `social_flows` | `id` | 10 | 1 | backend/sql/007_social.sql:17 |
| `image_uploads` | `id` | 9 | 1 | backend/sql/009_uploads.sql:1 |
| `password_resets` | `token_hash` | 5 | 1 | backend/sql/010_password_recovery.sql:1 |
| `schema_migrations` | `name` | 3 | 0 | backend/scripts/migrations.mjs:7 |

## Relaciones

La multiplicidad del extremo padre indica cuántos padres puede referenciar una fila hija; la del extremo hijo indica cuántas filas hijas admite un padre. El mínimo cero del extremo hijo no se reemplaza por uno por una regla del formulario.

| Extremo padre | Multiplicidad padre | Multiplicidad hija | Extremo hijo | Tipo |
| --- | --- | --- | --- | --- |
| `users(id)` | 1 | 0..N | `user_roles(user_id)` | Identificante |
| `roles(code)` | 1 | 0..N | `user_roles(role_code)` | Identificante |
| `users(id)` | 1 | 0..N | `sessions(user_id)` | No identificante |
| `sessions(id)` | 1 | 0..N | `refresh_tokens(session_id)` | No identificante |
| `spaces(id)` | 1 | 0..N | `furniture(space_id)` | Identificante |
| `furniture(space_id, code)` | 1 | 0..1 | `booths(space_id, furniture_code)` | No identificante |
| `users(id)` | 1 | 0..N | `projects(creator_id)` | No identificante |
| `booths(id)` | 1 | 0..N | `projects(requested_booth_id)` | No identificante |
| `projects(id)` | 1 | 0..N | `project_members(project_id)` | Identificante |
| `users(id)` | 1 | 0..N | `project_members(user_id)` | Identificante |
| `projects(id)` | 1 | 0..N | `project_teachers(project_id)` | Identificante |
| `users(id)` | 1 | 0..N | `project_teachers(user_id)` | Identificante |
| `projects(id)` | 1 | 0..N | `project_subjects(project_id)` | Identificante |
| `subjects(id)` | 1 | 0..N | `project_subjects(subject_id)` | Identificante |
| `booths(id)` | 1 | 0..1 | `booth_allocations(booth_id)` | Identificante |
| `projects(id)` | 1 | 0..1 | `booth_allocations(project_id)` | No identificante |
| `projects(id)` | 1 | 0..N | `project_reviews(project_id)` | No identificante |
| `users(id)` | 1 | 0..N | `project_reviews(actor_id)` | No identificante |
| `projects(id)` | 1 | 0..N | `project_resource_requests(project_id)` | Identificante |
| `resources(id)` | 1 | 0..N | `project_resource_requests(resource_id)` | Identificante |
| `project_resource_requests(project_id, resource_id)` | 1 | 0..1 | `resource_allocations(project_id, resource_id)` | Identificante |
| `resources(id)` | 1 | 0..N | `inventory_events(resource_id)` | No identificante |
| `users(id)` | 1 | 0..N | `inventory_events(actor_id)` | No identificante |
| `projects(id)` | 1 | 0..N | `loans(project_id)` | No identificante |
| `resources(id)` | 1 | 0..N | `loans(resource_id)` | No identificante |
| `users(id)` | 1 | 0..N | `loans(recipient_id)` | No identificante |
| `users(id)` | 1 | 0..N | `loans(delivered_by)` | No identificante |
| `loans(id)` | 1 | 0..N | `loan_returns(loan_id)` | No identificante |
| `users(id)` | 1 | 0..N | `loan_returns(received_by)` | No identificante |
| `resources(id)` | 1 | 0..1 | `resource_conditions(resource_id)` | Identificante |
| `inventory_events(id)` | 1 | 0..1 | `inventory_condition_events(event_id)` | Identificante |
| `loan_returns(id)` | 0..1 | 0..N | `inventory_condition_events(loan_return_id)` | No identificante |
| `users(id)` | 1 | 0..N | `gallery_photos(author_id)` | No identificante |
| `gallery_photos(id)` | 1 | 0..N | `gallery_reviews(photo_id)` | No identificante |
| `users(id)` | 1 | 0..N | `gallery_reviews(actor_id)` | No identificante |
| `social_providers(code)` | 1 | 0..N | `social_identities(provider)` | Identificante |
| `users(id)` | 1 | 0..N | `social_identities(user_id)` | No identificante |
| `social_providers(code)` | 1 | 0..N | `social_flows(provider)` | No identificante |
| `users(id)` | 1 | 0..N | `image_uploads(owner_id)` | No identificante |
| `users(id)` | 1 | 0..N | `password_resets(user_id)` | No identificante |

## Restricciones que no deben inferirse como FK

- `projects.image_url` y `gallery_photos.image_url` se validan en código; no referencian por FK a `image_uploads`.
- `loans(project_id, resource_id)` no tiene FK compuesta a `resource_allocations`; la reserva se verifica en la operación del backend.
- `social_flows.email` no referencia a `users.email`.
- `auth_rate_limits` y `schema_migrations` son tablas independientes.
- `social_flows.binding_hash` es nullable y se incorpora en 008, después de `proof_hash`.
- La unicidad diaria de préstamos es `(project_id, resource_id, day)`. Los grupos U1/U2 del dibujo identifican restricciones UNIQUE completas.
