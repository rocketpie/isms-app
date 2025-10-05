-- 010_isms.sql
CREATE SCHEMA IF NOT EXISTS isms;

-- Basic Assets =================================================================
-- Ownership 
-- People (assets / owners in app context; not auth users)
CREATE TABLE
  IF NOT EXISTS isms.people (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
    name varchar(255) NOT NULL
  );

-- All Assets need an owner. Owners need replacements. 
-- an owner must be a person, but might be a member of a team.
CREATE TABLE
  IF NOT EXISTS isms.ownership (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
    name varchar(255) NOT NULL,
    primary_person_id uuid REFERENCES isms.people (id) ON DELETE CASCADE,
    deputy_person_id uuid REFERENCES isms.people (id) ON DELETE CASCADE
  );

-- Systems have a location
-- Locations
CREATE TABLE
  IF NOT EXISTS isms.locations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
    name varchar(255) NOT NULL,
    owner_id uuid REFERENCES isms.ownership (id),
    description text
  );

-- Systems
CREATE TABLE
  IF NOT EXISTS isms.systems (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
    name varchar(255) NOT NULL,
    owner_id uuid REFERENCES isms.ownership (id),
    description text,
    location_id uuid REFERENCES isms.locations (id)
  );

-- Data needs to be categorized
CREATE TABLE
  IF NOT EXISTS isms.data_categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
    name varchar(255) NOT NULL,
    description text
  );

-- Data
CREATE TABLE
  IF NOT EXISTS isms.data (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
    name varchar(255) NOT NULL,
    owner_id uuid REFERENCES isms.ownership (id),
    category_id uuid REFERENCES isms.data_categories (id),
    description text
  );

-- Processes
CREATE TABLE
  IF NOT EXISTS isms.processes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
    name varchar(255) NOT NULL,
    owner_id uuid REFERENCES isms.ownership (id),
    description text
  );

-- Applications
CREATE TABLE
  IF NOT EXISTS isms.applications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
    name varchar(255) NOT NULL,
    owner_id uuid REFERENCES isms.ownership (id),
    description text
  );

-- Connections (e.g., network links/integrations)
CREATE TABLE
  IF NOT EXISTS isms.connections (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
    name varchar(255) NOT NULL,
    owner_id uuid REFERENCES isms.ownership (id),
    description text
  );

-- Junctions =================================================================
-- Process ↔ Application
CREATE TABLE
  IF NOT EXISTS isms.process_applications (
    process_id uuid NOT NULL REFERENCES isms.processes (id) ON DELETE CASCADE,
    application_id uuid NOT NULL REFERENCES isms.applications (id) ON DELETE CASCADE,
    PRIMARY KEY (process_id, application_id)
  );

-- Application ↔ System
CREATE TABLE
  IF NOT EXISTS isms.application_systems (
    application_id uuid NOT NULL REFERENCES isms.applications (id) ON DELETE CASCADE,
    system_id uuid NOT NULL REFERENCES isms.systems (id) ON DELETE CASCADE,
    PRIMARY KEY (application_id, system_id)
  );

-- System ↔ Data
CREATE TABLE
  IF NOT EXISTS isms.system_data (
    system_id uuid NOT NULL REFERENCES isms.systems (id) ON DELETE CASCADE,
    data_id uuid NOT NULL REFERENCES isms.data (id) ON DELETE CASCADE,
    PRIMARY KEY (system_id, data_id)
  );

-- Location ↔ Connection
CREATE TABLE
  IF NOT EXISTS isms.location_connections (
    location_id uuid NOT NULL REFERENCES isms.locations (id) ON DELETE CASCADE,
    connection_id uuid NOT NULL REFERENCES isms.connections (id) ON DELETE CASCADE,
    PRIMARY KEY (location_id, connection_id)
  );

-- Junction lookup helpers
CREATE INDEX IF NOT EXISTS jm_proc_apps_app_idx ON isms.process_applications (application_id);

CREATE INDEX IF NOT EXISTS jm_app_sys_sys_idx ON isms.application_systems (system_id);

CREATE INDEX IF NOT EXISTS jm_sys_data_data_idx ON isms.system_data (data_id);

CREATE INDEX IF NOT EXISTS jm_loc_conn_conn_idx ON isms.location_connections (connection_id);

-- Maps =================================================================
-- Maps
CREATE TABLE
  IF NOT EXISTS isms.maps (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
    name varchar(255) NOT NULL,
    owner_id uuid REFERENCES isms.ownership (id),
    description text
  );

-- Icons
CREATE TABLE
  IF NOT EXISTS isms.map_icons (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
    name varchar(255) NOT NULL,
    data_version integer NOT NULL,
    data jsonb NOT NULL -- svg / url / stroke, arrowheads, labels, etc.
  );

-- Map nodes (asset locations on a map)
-- Attention: keep in sync with kb-4015-api-asset-kinds.md
CREATE TABLE
  IF NOT EXISTS isms.map_nodes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
    map_id uuid REFERENCES isms.maps (id) ON DELETE CASCADE,
    asset_kind varchar(255) NOT NULL CHECK (
      asset_kind IN (
        'person',
        'ownership',
        'process',
        'application',
        'system',
        'location',
        'data',
        'connection',
        'data_category'
      )
    ),
    asset_id uuid NOT NULL,
    map_x double precision NOT NULL,
    map_y double precision NOT NULL,
    icon_id uuid REFERENCES isms.map_icons (id),
    data_version integer NOT NULL,
    data jsonb NOT NULL -- annotation / color / border / labels etc.
  );

CREATE INDEX IF NOT EXISTS idx_map_nodes_map ON isms.map_nodes (map_id);