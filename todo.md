# Mentoring Advice Manager - TODO

## Database & Schema
- [x] Design and create database schema (resources, collections, tags, resource_tags tables)
- [x] Generate Drizzle migrations
- [x] Apply migrations to database

## Backend API Routes
- [x] Create resource CRUD procedures (create, list, get, update, delete)
- [x] Create collection CRUD procedures
- [x] Create tag management procedures (list, auto-suggest)
- [x] Create search procedure (keyword + tag filter)
- [x] Write vitest tests for backend procedures (17 tests passing)

## Frontend - Layout & Navigation
- [x] Set up elegant dashboard layout with sidebar
- [x] Implement sidebar navigation (All Resources, Collections, Tags, Search)
- [x] Create responsive design for mobile/tablet/desktop
- [x] Set up routing structure

## Frontend - Core Features
- [x] Build resource card component
- [x] Implement resource list view with pagination
- [x] Create resource creation form (title, description, URL/text, tags)
- [x] Build resource detail view with edit/delete
- [x] Implement collection management (create, rename, delete)
- [x] Build tag management view with all tags
- [x] Implement search page with keyword + tag filtering
- [x] Add tag auto-suggest in resource form

## Frontend - Polish & Testing
- [x] Refine styling for elegant, polished appearance
- [x] Test all end-to-end flows
- [x] Verify authentication redirects work correctly
- [x] Test pagination, search, and filtering
- [x] Optimize performance and accessibility

## Deployment
- [x] Create final checkpoint
- [x] Prepare for publishing

## New Features
- [x] Replace test data with curated default resources for new users (5 articles about reading, learning, and communication)
- [x] Add hasSeededDefaultResources flag to users table to prevent re-seeding
- [x] Update seeding logic to only seed on first login
- [x] Add vitest tests for seeding functionality (3 tests passing)
