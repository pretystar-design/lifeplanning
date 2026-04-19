## ADDED Requirements

### Requirement: User registration
The system SHALL allow new users to register with an email address and password.

#### Scenario: Successful registration
- **WHEN** user submits a valid email and password (min 8 chars, 1 uppercase, 1 number)
- **THEN** system creates a new user account and returns a JWT access token

#### Scenario: Registration with duplicate email
- **WHEN** user submits an email that already exists in the system
- **THEN** system returns a 409 Conflict error with message "Email already registered"

#### Scenario: Registration with invalid password
- **WHEN** user submits a password that does not meet requirements
- **THEN** system returns a 400 Bad Request error with validation details

### Requirement: User login
The system SHALL allow registered users to log in with their email and password.

#### Scenario: Successful login
- **WHEN** user submits correct email and password
- **THEN** system returns a JWT access token (15 min expiry) and a refresh token (7 day expiry) in an httpOnly cookie

#### Scenario: Login with incorrect password
- **WHEN** user submits correct email but incorrect password
- **THEN** system returns a 401 Unauthorized error with message "Invalid credentials"

#### Scenario: Login with non-existent email
- **WHEN** user submits an email that does not exist in the system
- **THEN** system returns a 401 Unauthorized error with message "Invalid credentials" (no email enumeration)

### Requirement: Token refresh
The system SHALL allow users to refresh their access token using a valid refresh token.

#### Scenario: Successful token refresh
- **WHEN** user presents a valid refresh token in httpOnly cookie
- **THEN** system returns a new JWT access token with 15 minute expiry

#### Scenario: Expired refresh token
- **WHEN** user presents an expired refresh token
- **THEN** system returns a 401 Unauthorized error requiring re-login

#### Scenario: Invalid refresh token
- **WHEN** user presents a malformed or tampered refresh token
- **THEN** system returns a 401 Unauthorized error

### Requirement: User profile management
The system SHALL allow authenticated users to view and update their profile information.

#### Scenario: View own profile
- **WHEN** authenticated user requests their profile
- **THEN** system returns user id, email, name, created_at (password not included)

#### Scenario: Update own profile
- **WHEN** authenticated user updates their name or password
- **THEN** system persists the changes and returns updated profile

#### Scenario: Profile access without authentication
- **WHEN** unauthenticated user attempts to access profile
- **THEN** system returns a 401 Unauthorized error

### Requirement: Role-based access
The system SHALL support role-based access control for individual and family admin users.

#### Scenario: Individual user has personal access
- **WHEN** a user with role "individual" accesses their own resources
- **THEN** system grants full access to personal goals, habits, and budgets

#### Scenario: Family admin can manage family members
- **WHEN** a user with role "family_admin" invites or removes family members
- **THEN** system processes the request if the user is the family owner

#### Scenario: Access to another user's private resources
- **WHEN** user attempts to access another user's private goals or habits
- **THEN** system returns a 403 Forbidden error