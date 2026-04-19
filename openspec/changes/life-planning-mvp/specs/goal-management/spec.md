## ADDED Requirements

### Requirement: Create personal goal
The system SHALL allow authenticated users to create personal goals with required title, category, target date, and optional description.

#### Scenario: Successful goal creation
- **WHEN** authenticated user submits a goal with title, category (financial|health|career|personal), and target_date
- **THEN** system creates the goal linked to the user and returns goal id, title, category, target_date, created_at

#### Scenario: Goal creation without required fields
- **WHEN** authenticated user submits a goal missing title or category or target_date
- **THEN** system returns a 400 Bad Request with validation errors

#### Scenario: Goal creation with invalid category
- **WHEN** authenticated user submits a goal with a category not in (financial, health, career, personal)
- **THEN** system returns a 400 Bad Request with "Invalid category" message

### Requirement: Update goal
The system SHALL allow authenticated users to update their own goals.

#### Scenario: Successful goal update
- **WHEN** authenticated user updates title, description, target_date, or status on their own goal
- **THEN** system persists changes and returns updated goal

#### Scenario: Update another user's goal
- **WHEN** authenticated user attempts to update a goal they do not own
- **THEN** system returns a 403 Forbidden error

### Requirement: Delete goal
The system SHALL allow authenticated users to delete their own goals.

#### Scenario: Successful goal deletion
- **WHEN** authenticated user deletes their own goal
- **THEN** system removes the goal and associated progress entries and returns 204 No Content

#### Scenario: Delete goal with associated milestones
- **WHEN** authenticated user deletes a goal with milestones and progress entries
- **THEN** system cascades delete to milestones and progress entries

### Requirement: Set milestones on goal
The system SHALL allow authenticated users to add milestones to their goals with a title and target date.

#### Scenario: Add milestone to goal
- **WHEN** authenticated user adds a milestone with title and target_date to their goal
- **THEN** system creates the milestone linked to the goal

#### Scenario: Milestone target date after goal target date
- **WHEN** authenticated user adds a milestone with target_date after the goal's target_date
- **THEN** system returns a 400 Bad Request with "Milestone date cannot exceed goal date"

### Requirement: Log progress on goal
The system SHALL allow authenticated users to log progress entries on their goals with notes and optional value.

#### Scenario: Log progress with notes
- **WHEN** authenticated user logs progress with notes on their goal
- **THEN** system creates a progress entry with timestamp, notes, and associated user

#### Scenario: Log progress on another user's goal
- **WHEN** authenticated user attempts to log progress on a goal they do not own
- **THEN** system returns a 403 Forbidden error

### Requirement: View goal progress history
The system SHALL allow authenticated users to view the progress history of their goals.

#### Scenario: View progress history
- **WHEN** authenticated user requests progress history for their goal
- **THEN** system returns a list of progress entries ordered by created_at descending

### Requirement: List and filter goals
The system SHALL allow authenticated users to list their goals with optional filtering by category and status.

#### Scenario: List all user goals
- **WHEN** authenticated user requests their goals without filters
- **THEN** system returns all goals owned by the user with progress percentage

#### Scenario: Filter goals by category
- **WHEN** authenticated user requests goals filtered by category "financial"
- **THEN** system returns only goals with category "financial" owned by the user

#### Scenario: Filter goals by status
- **WHEN** authenticated user requests goals filtered by status "in_progress"
- **THEN** system returns only goals with status "in_progress" owned by the user